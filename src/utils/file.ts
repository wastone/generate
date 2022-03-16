import path from 'path'
import fs from 'fs'
import chalk from 'chalk'
const errorLog = (error:string) => { console.log(chalk.red(`${error}`)) }


// 递归创建目录
function mkdirs (directory: string, callback: () => void) {
  var exists = fs.existsSync(directory)
  if (exists) {
    callback()
  } else {
    mkdirs(path.dirname(directory), function () {
      fs.mkdirSync(directory)
      callback()
    })
  }
}

// 创建目录
export function dotExistDirectoryCreate (directory: string) {
  return new Promise((resolve) => {
    mkdirs(directory, function () {
      resolve(true)
    })
  })
}

// 根据路径和数据写文件
export const generateFile = (path: string, data: string) => {
  if (fs.existsSync(path)) {
    errorLog(`${path}文件已存在`)
    return
  }
  return new Promise((resolve, reject) => {
    fs.writeFile(path, data, 'utf8', (err: any) => {
      if (err) {
        errorLog(err.message)
        reject(err)
      } else {
        resolve(true)
      }
    })
  })
}
