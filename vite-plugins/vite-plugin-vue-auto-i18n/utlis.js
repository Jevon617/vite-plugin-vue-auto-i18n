

const path = require('path')
const fs = require('fs-extra')
// const hashLib = require('node-file-hash')

exports.resolveOptions = options=> {
  options.output = options.output ? options.output : path.resolve(__dirname, '../../locales')
  options.locale = options.locale ? options.locale : 'zh'
  options.locales = options.locales ? options.locales : ['zh', 'en', 'kor', 'jp']
  return options
}


let timer = null
let cacheMap = {}

exports.deboundceWrite = (source, lang, options)=> {
  try {
    if (timer) clearTimeout(timer)
    const targetPath = path.resolve(options.output, lang + '.json')
    if (!cacheMap[targetPath]) {
      cacheMap[targetPath] = JSON.parse(source)
    } else {
      Object.assign(cacheMap[targetPath], JSON.parse(source))
    }

    timer = setTimeout(()=> {
      for (let targetPath in cacheMap) {
        let source = JSON.stringify(cacheMap[targetPath])

        if (fs.existsSync(targetPath)) {
          fs.writeFileSync(targetPath, source)
        } else {
          fs.ensureFileSync(targetPath, source)
          fs.writeFileSync(targetPath, source)
        }
      }
      timer = null
    }, 1000)
  } catch(e){
    console.log(e)
  }
}

exports.write = (source, lang, options)=> {
  const targetPath = path.resolve(options.output, lang + '.json')
  if (fs.existsSync(targetPath)) {
    let newCode = JSON.parse(source)
    let code = JSON.parse(fs.readFileSync(targetPath, 'utf-8'))
    Object.assign(code, newCode)
    fs.writeFileSync(targetPath, JSON.stringify(code))
  } else {
    fs.ensureFileSync(targetPath, source)
    fs.writeFileSync(targetPath, source)
  }
}

const readDir = async (input, ret=[])=> {
  let res = await fs.readdir(input)
  for (let i = 0; i < res.length; i++) {
    let dir = res[i]
    let filePath = path.resolve(input, dir)
    let r = await fs.stat(filePath)
    if (r.isDirectory()) {
      await readDir(filePath, ret)
    } else {
      ret.push(filePath)
    }
  }
  return ret
}

exports.readDir = readDir

// const createHash = async filePath=> {
//     try {
//         const buffer = fs.readFileSync(filePath)
//         const hash = await hashLib.createHash(buffer)
//         console.log(hash.md5)
//     } catch(e) {
//         process.exit(1)
//     }

// }
