
const generate = require('@babel/generator').default
const md5 = require('js-md5')
const request = require('request')
const { write, deboundceWrite } = require('./utlis')

module.exports = function(api, options) {

  const save = (state, key, value)=> {
    const record = state.file.get('record')
    record[key] = value // 保留key 与 源字符 的对应关系
  }

  const translate = (record, lng="zh")=> {
    // zh 中文, en 英文, jp 日语
    return new Promise((resolve, reject)=> {
      const words = Object.values(record).join('\n')
      const salt = new Date().getTime().toString().slice(0, -3)
      const appid = '20220118001058391'
      const key = 'vVAFnYA5k40snM2GgU5h'
      const sign = md5(appid + words + salt + key)
      const url = `http://api.fanyi.baidu.com/api/trans/vip/translate?q=${encodeURIComponent(words)}&from=auto&to=${lng}&appid=${appid}&salt=${salt}&sign=${sign}`
      request({
        url: url,
        method: "GET",
        json: true,
        headers: {
          "content-type": "application/x-www-form-urlencoded"
        }
      }, function(error, response, body) {
        if (!error && response.statusCode == 200) {
          resolve(body.trans_result)
        } else {
          reject(error)
        }
      })
    })
  }

  const transformStaticNodeToDyamicNode = p=> {
    p.findParent(parent=>{
      if (parent.isCallExpression() && (parent.node.callee.name === '_createElementVNode' || parent.node.callee.name === '_createTextVNode' || parent.node.callee.name === 'createBaseVNode')) {
        if (parent.node.arguments.length >=4) {
          parent.node.arguments.splice(3, 1, api.types.NumericLiteral(1))
        } else {
          parent.node.arguments.push(api.types.NumericLiteral(1))
        }
      } else if (p.parentPath.isObjectProperty() && parent.isCallExpression() && parent.node.callee.name === '_createVNode') {
        //  createVNode(_component_TestInfoVue, { msg: _ctx.test }, null, 8, ["msg"])
        let arg2 = parent.node.arguments[2] === undefined ? api.types.NullLiteral() : parent.node.arguments[2]
        let arg3 = parent.node.arguments[3] === undefined ? api.types.NumericLiteral(8) : parent.node.arguments[3]
        let arg4 = parent.node.arguments[4]
        let keyName = p.parentPath.node.key.name
        // 如果有多个动态属性
        if (arg4 && api.types.isArrayExpression(arg4)) {
          arg4.elements.push(api.types.StringLiteral(keyName))
        } else {
          // 添加动态属性， 并把patchFlag置为8
          parent.node.arguments.splice(2, 2, arg2, arg3, api.template.ast(`['${keyName}']`).expression)
        }
      }
    })
  }

  return {
    pre(file) {
      file.set('record', {})
    },
    visitor: {
      Program: {
        enter(path, state) {
          // 当leadingComments 是/*__i18n__*/时, 需要转译
          path.traverse({
            'StringLiteral|TemplateLiteral'(p) {
              let leadingComments = p.node.leadingComments || p.parentPath.isBinaryExpression() && p.parentPath.node.left === p.node && p.parentPath.node.leadingComments || []
              if (leadingComments.findIndex(c=> c.value.includes('__i18n__')) > -1) {
                // 非script-setup语法不需要转译setup中的内容
                if (p.findParent(parent=> parent.isObjectMethod() && parent.node.key.name === 'setup') && !options.isScriptSetup) {
                  p.node.needTransform = false
                  return
                }

                p.findParent(parent=> {
                  if(parent.isVariableDeclarator() && parent.node.id.name.startsWith('_hoisted')) {
                    const id = parent.get('id')
                    const name = id.node.name
                    id.scope.bindings[name].referencePaths[0].replaceWith(parent.get('init').node)
                    parent.stop()
                    parent.remove()
                  }
                })

                p.node.needTransform = true
                p.node.__ctx__ = '_ctx'
                // 寻找环境变量
                p.findParent(parent=> {
                  if (parent.isFunctionDeclaration() && parent.node.id.name === 'render') {
                    p.node.__ctx__ = parent.node.params && parent.node.params[0] && parent.node.params[0].name
                  }
                })
              }
            }
          })
        }
      },

      StringLiteral(p, state) {
        if (p.node.needTransform) {
          const key = options.generateKey()
          save(state, key, p.node.value) // 保留key 与 源字符 的对应关系
          // 替换当前节点
          const prefix = p.node.__ctx__
          transformStaticNodeToDyamicNode(p)
          p.replaceWith(api.template.ast(`${prefix}.$t('${key}')`))
          p.skip()
        }
      },
      TemplateLiteral(p, state) {
        if (p.node.needTransform) {

          function getReplaceExpression(path, key, saveValue) {
            let index = 1
            const prefix = p.node.__ctx__

            let expressionParams = path.isTemplateLiteral() ? path.node.expressions.map(item => generate(item).code) : null
            if (expressionParams) {
              expressionParams.unshift('')
            }
            expressionParams = expressionParams ? JSON.stringify(expressionParams).replace(/\"/g, "") : null

            transformStaticNodeToDyamicNode(p)

            let replaceExpression = api.template.ast(`${prefix}.$t('${key}',${expressionParams})`).expression

            saveValue = saveValue.replace(/\{__placeholder__\}/g, function(){
              return `{${index++}}`
            })
            save(state, key, saveValue) // 保留key 与 源字符 的对应关系
            return replaceExpression
          }

          const value = p.get('quasis').map(item => item.node.value.raw).join('{__placeholder__}')
          if(value) {
            const key = options.generateKey()
            p.replaceWith(getReplaceExpression(p, key, value))
            p.skip()
          }
        }
      }
    },
    post(file) {
      const writeFile = options.isMain ? write : deboundceWrite
      const record = file.get('record')

      // 没有字段则不保存为文件
      if (!Object.keys(record).length) {
        return options.clear && options.clear()
      }

      const source = JSON.stringify(record)
      writeFile(source, options.locale, options)

      const toTransformLocales = options.locales.filter(locale => locale !== options.locale)
      Promise.all(toTransformLocales.map(lang=> translate(record, lang))).then(resArr=> {
        resArr.forEach((res, i)=> {
          const lang = toTransformLocales[i]
          const copy = Object.assign({}, record)
          Object.keys(copy).forEach((item, index)=> {
            copy[item] = res[index].dst
          })
          const source = JSON.stringify(copy)
          writeFile(source, lang, options)
        })
        options.clear && options.clear()
      })
    }
  }
}

