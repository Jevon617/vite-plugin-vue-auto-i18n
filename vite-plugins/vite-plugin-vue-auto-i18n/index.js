const path = require('path')
const fs = require('fs-extra')
import { normalizePath } from 'vite'
const babel = require('@babel/core')
const autoI18n = require('./auto-i18n')
const autoInject = require('./auto-inject')
const compilerSfc = require('@vue/compiler-sfc')
const compilerDom = require('@vue/compiler-dom')
const { readDir } = require('./utlis')

export default function myPlugin(options = {
  output : path.resolve(__dirname, '../../locales'),
  locale : 'zh',
  locales : ['zh', 'en', 'kor', 'jp']
}) {

  let key = 0
  let isProduction = false
  const fileRegex = /\.vue$/
  const inputFileId = options.entry || 'main.js'
  const input = options.input || path.resolve(process.cwd(), './src')

  const generateKey = ()=> {
    key ++
    return `i18n${key}`
  }

  const transformVueTemplate = (code, clear)=> {
    const compileScript = compilerSfc.compileScript
    const descriptor = compilerSfc.parse(code).descriptor || {}
    // 区分script-setup语法和普通语法
    // script-setup语法需要先通过compileScript转成render函数, 再进行代码注入, 而普通语法只需要对于template模块进行代码注入
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
      plugins: [[autoI18n, {...options, clear, generateKey, isScriptSetup: !!descriptor.scriptSetup}]],
      configFile: false, // 不读取根目录下的babel配置
      babelrc: false
    })

    let retCode = ''
    if (descriptor.scriptSetup) {
      retCode = `<script>\n ${transformObj.code} \n</script>`
    } else {
      // 替换export default
      scriptContent = scriptContent
                && scriptContent.replace('export default ', `${transformObj.code} \n const __script = `)
                || `${transformObj.code} \n const __script = {}`
      retCode = `<script> \n${scriptContent} \n  __script.render = render   \n export default __script \n </script>`
    }

    return retCode
  }

  const generateLocales = async(input, clearSleep)=> {

    let fileCount = 0
    let filePaths = await readDir(input)

    const clear = function() {
      fileCount--
      if (fileCount === 0) {
        clearSleep()
      }
    }

    filePaths.forEach(filePath=> {
      if (fileRegex.test(filePath)) {
        fileCount ++ // 统计vue文件数量
        const code = fs.readFileSync(filePath, 'utf-8')
        transformVueTemplate(code, clear)
      }
    })
  }

  const sleep = fn=> {
    return new Promise(async resolve=> {
      let timer = setTimeout(resolve, 10000)
      let clearSleep = ()=> {
        resolve()
        clearTimeout(timer)
        timer = null
      }
      await fn(input, clearSleep)
    })
  }

  return {
    name: 'vite-plugin-vue-auto-i18n',
    enforce: 'pre',
    config(_, { command }) {
      isProduction = command === 'build'
    },
    async load(id) {
      if (id.endsWith(inputFileId)) {
        if (!fs.existsSync(options.output) || isProduction) {
          // 等待生成语言包
          await sleep(generateLocales)
        }

        const code = fs.readFileSync(id, 'utf-8')

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
    },
    async transform(code, id) {
      if (fileRegex.test(id)) {
        return {
          code: transformVueTemplate(code)
        }
      }
    }
  }
}
