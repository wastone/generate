import { createRequire } from 'module';
const require = createRequire(import.meta.url);

const path = require('path')
const Generate = require('../lib/index')

import { fileURLToPath } from 'url'
const filename = fileURLToPath(import.meta.url) // 这里不能声明__filename,因为已经有内部的__filename了，重复声明会报错
const __dirname = path.dirname(filename)

/*=========== 自己的数据库配置 ================*/
// oracle 配置
const databaseConfig = {
  user: '*',
  password: '*',
  host: '*.*.*.*',
  port: 1521,
  serviceID: '*'
}

// mysql 配置
// const databaseConfig = {
//   user: 'root',
//   password: 'root',
//   host: '127.0.0.1',
//   port: 3306,
//   database: 'myfund'
// }

function test11 () {
  return 'test11'
}
function test22 () {
  return 'test22'
}

let generate = new Generate()

// 设置数据库配置
generate.setDatabase('oracle', databaseConfig)

// 设置全局模板用方法对象
generate.setGlobalTempUtils({
  test11
})
// API模板配置
const apiConfig = {
  tplPath: path.resolve(__dirname, './tpl/api.art'),
  outPath: path.resolve(__dirname, './dist/api.js'),
  customTempUtils: {
    test22
  }
}
// 页面模板配置
const showViewConfig = {
  tplPath: path.resolve(__dirname, './tpl/onlyshowview.art'),
  outPath: path.resolve(__dirname, './dist/show.vue')
}

async function run () {
  console.log('======开始======')
  try {
    await generate.createFile([apiConfig, showViewConfig])
  } catch (error) {
    console.log(error)
    return Promise.reject('生成失败')
  }
}

run().then(() => {
  console.log('======全部生成结束======')
})
