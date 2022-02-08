
const generate = require('@babel/generator').default

module.exports = function(api, options) {

  return {
    visitor: {
      Program: {
        enter(path, state) {
            console.log('开始处理main.js')
          // 遍历所有ImportDeclaration是否引入国际化的包
          path.traverse({
            ImportDeclaration(p) {
              if (p.node.source.value === 'vue-i18n') {
                state.imported = true
                path.traverse({
                  ImportSpecifier(p) {
                    state.createI18n = p.node.local.name
                  }
                })
              } else if (p.node.source.value === 'vue') {
                path.traverse({
                  ImportSpecifier(p) {
                    state.createApp = p.node.local.name
                  }
                })
              }
              state.importIndex = state.importIndex === (void 0) ? 1 : state.importIndex + 1
            }
          })

          if (!state.imported) {
            state.createI18n = path.scope.generateUid("createI18n")
            const ast = api.template.ast(`import { createI18n as ${state.createI18n} } from 'vue-i18n'`)
            path.node.body.unshift(ast)
            state.importIndex ++
          }

          state.vueI18n = path.scope.generateUid("i18n")
          const asts = api.template.statements(`
            ${options.locales.map(locale=> `import ${locale} from '../locales/${locale}.json'`).join('\n')}
            const ${state.vueI18n} = ${state.createI18n}({
              legacy: false,
              globalInjection: true,
              locale: ${options.locale},
              messages: {
                ${options.locales.join(',')}
              }
            })
          `)()

          path.node.body.splice(state.importIndex, 0, ...asts)
        }
      },

      CallExpression(path, state) {
        if (path.node.callee.name === state.createApp) {
          path.findParent(parent=> {
            if (parent.parentPath && parent.parentPath.isProgram()) {

              if (parent.isExpressionStatement()) {
                let code = generate(parent.node).code
                code = code.replace(/mount\(/, `use(${state.vueI18n}).mount(`)
                parent.replaceWith(api.template.ast(code))
                parent.stop()

              }else if (parent.isVariableDeclaration()) {
                // 查找声明语句的 变量名称, 找到第一个就停止遍历
                parent.traverse({
                  VariableDeclarator(p) {
                    state.vueInstance = p.node.id.name
                    parent.stop()
                  }
                })

                // 将vueI18n通过use方式安装到vue
                let code = generate(parent.node).code
                if (code.indexOf('.mount(') > -1) {
                  code = code.replace(/mount\(/, `use(${state.vueI18n}).mount(`)
                  parent.replaceWith(api.template.ast(code))
                  parent.stop()
                } else {
                  const nextSiblings = parent.getAllNextSiblings()
                  const nextSiblingCodes = nextSiblings.map(item=> generate(item.node).code)
                  const index = nextSiblingCodes.findIndex(code=> code.indexOf('.mount(') > -1)
                  if (index > -1) {
                    const target = nextSiblings[index]
                    let code = nextSiblingCodes[index].replace(/mount\(/, `use(${state.vueI18n}).mount(`)
                    target.replaceWith(api.template.ast(code))
                  }
                }
              }
              // 注入$changeLocale
              const changeLangAst = api.template.ast(`${state.vueInstance}.config.globalProperties.$changeLocale = locale=> {
                ${state.vueInstance}.config.globalProperties.$i18n.locale = locale
              }`)
              parent.parentPath.node.body.push(changeLangAst)
              parent.stop()
            }
          })
        }
      }
    }
  }
}

