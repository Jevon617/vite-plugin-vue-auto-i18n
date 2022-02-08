const compilerSfc = require('@vue/compiler-sfc')
const compilerDom = require('@vue/compiler-dom')
const babel = require('@babel/core')
const autoI18n = require('./auto-i18n')
const autoInject = require('./auto-inject')
const path = require('path')
const fs = require('fs-extra')
const { readDir, resolveOptions } = require('./utlis')
import { normalizePath } from 'vite'

export default function myPlugin(options = {}) {

    options = resolveOptions(options)

    let key = 0
    const fileRegex = /\.vue$/
    const inputFileId = options.entry || 'main.js'
    const input = options.input || path.resolve(process.cwd(), './src')
    const codeCache = {}

    const generateKey = ()=> {
      key ++
      return `i18n${key}`
    }

    const generateLocales = async(input, options, clearSleep)=> {

      if (fs.existsSync(options.output)) {
        fs.removeSync(options.output)
      }

      let fileCount = 0
      let filePaths = await readDir(input)

      const clear = function() {
        fileCount--
        if (fileCount === 0) {
          clearSleep()
        }
      }

      filePaths.forEach(filePath=> {
        if (filePath.endsWith('.vue')) {
            fileCount ++ // 统计vue文件数量
            const code = fs.readFileSync(filePath, 'utf-8')
            const compileScript = compilerSfc.compileScript
            const descriptor = compilerSfc.parse(code).descriptor || {}
            // 区分script-setup语法和普通语法
            let scriptContent = descriptor.scriptSetup
                ? (compileScript(descriptor, {isProd: true, inlineTemplate: true, reactivityTransform: false, templateOptions: {} }).content)
                :(descriptor.script && descriptor.script.content || '')

            const toTransform = descriptor.scriptSetup
                ? scriptContent
                : compilerDom.compile(descriptor.template && descriptor.template.content || '', { mode: 'module' }).code.replace('export', '')

            const ast = babel.parseSync(toTransform, {
                sourceType: "unambiguous",
                configFile: false, // 不读取根目录下的babel配置
                babelrc: false
            })
            const transformObj = babel.transformFromAstSync(ast, toTransform, {
                plugins: [[autoI18n, {...options, clear, generateKey}]],
                configFile: false, // 不读取根目录下的babel配置
                babelrc: false
            })

            let retCode = ''
            if (descriptor.scriptSetup) {
                console.log(transformObj.code)
              retCode = `<script>\n ${transformObj.code} \n</script>`
            } else {
              // 替换export default
              scriptContent = scriptContent
                && scriptContent.replace('export default ', `${transformObj.code} \n const __script = `)
                || `${transformObj.code} \n const __script = {}`
              retCode = `<script> \n${scriptContent} \n  __script.render = render   \n export default __script \n </script>`
            }
            codeCache[normalizePath(filePath)] = retCode
        }
      })
    }

    return {
      name: 'vite-plugin-vue-auto-i18n',
      enforce: 'pre',
       async transform(code, id) {

        if (id.endsWith(inputFileId)) {

          const sleep = fn=> {
            return new Promise(async resolve=> {
              let timer = setTimeout(resolve, 10000)
              let clearSleep = ()=> {
                resolve()
                clearTimeout(timer)
                timer = null
              }
              await fn(input, options, clearSleep)
            })
          }

          // 等待生成语言包
          await sleep(generateLocales)

          // 添加语言包到入口文件
          const ast = babel.parseSync(code, {
            sourceType: "unambiguous",
            configFile: false, // 不读取根目录下的babel配置
            babelrc: false
          })

          const transformObj = babel.transformFromAstSync(ast, code, {
            plugins: [[autoInject, options]],
            configFile: false, // 不读取根目录下的babel配置
            babelrc: false
          })
          return {
            code: transformObj.code
          }
        }
        if (fileRegex.test(id)) {
          return {
            code: codeCache[id]
          }
        }
      }
    }
  }
