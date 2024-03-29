const path = require('path')
const Generate = require('../lib/index')

/*=========== 自己的数据库配置 ================*/
// oracle 配置
// const databaseConfig = {
//   user: '*', // 用户名
//   password: '*', // 密码
//   host: '*.*.*.*', // ip
//   port: 1521, // 端口
//   serviceID: '*' // 服务ID
// }

// mysql 配置
const databaseConfig = {
  user: 'root', // 用户名
  password: 'root', // 密码
  host: '127.0.0.1', // ip
  port: 3306, // 端口
  database: 'myfund' // 数据库名
}

function test11 () {
  return 'test11'
}
function test22 () {
  return 'test22'
}

let generate = new Generate()

// 设置数据库配置
generate.setDatabase('mysql', databaseConfig)

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
