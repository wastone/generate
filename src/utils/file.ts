const path = require('path')
const fs = require('fs')

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
export const generateFile = (path: string, data: string): Promise<{message: string} | boolean> => {
  return new Promise((resolve, reject) => {
    if (fs.existsSync(path)) {
      reject({ message:`${path}文件已存在` })
      return
    }
    fs.writeFile(path, data, 'utf8', (err: any) => {
      if (err) {
        reject(err)
      } else {
        resolve(true)
      }
    })
  })
}

// 读文件 =
export const readFile = (path: string, type:string = 'utf8'): any => {
  return new Promise((resolve, reject) => {
    fs.readFile(path, type, (err: any, data: any) => {
      if (err) {
        reject(err)
      } else {
        resolve(data)
      }
    })
  })
}
