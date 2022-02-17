const chalk = require('chalk')
import { normalizePath } from 'vite'
const path = require('path')
const fs = require('fs-extra')
const babel = require('@babel/core')
const autoI18n = require('./auto-i18n')
const autoInject = require('./auto-inject')
const compilerSfc = require('@vue/compiler-sfc')
const compilerDom = require('@vue/compiler-dom')
const { readDir } = require('./utlis')

export default function myPlugin(options = {
  output: path.resolve(__dirname, '../../locales'),
  locale:'zh',
  locales: ['zh', 'en', 'kor', 'jp']
}) {

  let key = 0
  let sourceDir = ''
  let entryJsName = ''
  let cacheCode = {}
  let isProduction = false
  const fileRegex = /\.vue$/

  const generateKey = ()=> {
    return `i18n${++key}`
  }

  const transformVueTemplate = (code, clear, filePath)=> {

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
      plugins: [[autoI18n, {...options, clear, generateKey, isScriptSetup: !!descriptor.scriptSetup, isMain: !!clear}]],
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
    if (isProduction) {
      cacheCode[normalizePath(filePath)] = retCode
    }
    return retCode
  }

  const generateLocales = async(sourceDir, clearSleep)=> {
    // 开发环境因为后续扫描vue文件, 生成语言包的时候会触发reload,
    // 重新加载main.js, 所以可以直接生成空语言包
    if (!isProduction) {
      options.locales.forEach(locale=> {
        const targetPath = path.resolve(options.output, locale + '.json')
        fs.ensureFileSync(targetPath, '{}')
        fs.writeFileSync(targetPath, '{}')
      })
      clearSleep()
    } else {
      let fileCount = 0
      let filePaths = await readDir(sourceDir)

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
          transformVueTemplate(code, clear, filePath)
        }
      })
    }
  }

  const sleep = fn=> {
    return new Promise(async resolve=> {
      let timer = setTimeout(resolve, 10000)
      let clearSleep = ()=> {
        resolve()
        clearTimeout(timer)
        timer = null
      }
      await fn(sourceDir, clearSleep)
    })
  }

  const getEntryJsName = root=> {
    if (!root) {
      root = process.cwd()
    }
    let indexHtmlPath = path.resolve(root, 'index.html')
    let code = fs.readFileSync(indexHtmlPath, 'utf-8')
    let matches = code.match(/\<script\s+type=\"module\"\s*src=\"(.*)\"\s*\>/) || []
    return matches[1] || ''
  }

  return {
    // 优化点: 第一次生成json语言包, vite会page reload,
    // 而后每次读取一个vue文件之后便会更新语言包, 从而多次page reload
    // 优化方案: 每次读取vue文件之后, 先在内存中缓存此次的语言包,等所有vue文件都编译完成之后, 统一生成语言包
    name: 'vite-plugin-vue-auto-i18n',
    enforce: 'pre',

    async config(config, { command }) {
      isProduction = command === 'build'
      sourceDir = options.sourceDir
      if (!sourceDir) {
        console.log(chalk.red('vite-plugin-vue-auto-i18n: 必须指定源文件目录'))
        process.exit(0)
      }
      entryJsName = getEntryJsName(config.root)
      if (!entryJsName) {
        console.log(chalk.red('vite-plugin-vue-auto-i18n: 无法在index.html找到入口js文件'))
        process.exit(0)
      }
    },
    async transform(code, id) {
      if (id.endsWith(entryJsName)) {

        // 生成环境需要先清空语言包, 再生成语言包, 确保无以前的内容
        if (isProduction) {
          fs.emptyDir(options.output)
          await sleep(generateLocales)
        } else {
        // 开发环境只有在不存在语言包的时候先生成空语言包, 防止报错
          if (!fs.existsSync(options.output)) {
            await sleep(generateLocales)
          }
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
      if (fileRegex.test(id)) {
        return {
          code: isProduction ? cacheCode[normalizePath(id)] : transformVueTemplate(code)
        }
      }
    }
  }
}
