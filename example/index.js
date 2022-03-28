const path = require('path')
const Generate = require('../lib/index')

/*=========== 自己的数据库配置 ================*/
// const databaseConfig = {
//   user: '**',
//   password: '**',
//   host: '192.168.2.**',
//   port: 1521,
//   serviceID: '**'
// }

const databaseConfig = {
  user: 'root',
  password: 'root',
  host: '127.0.0.1',
  port: 3306,
  database: '**'
}

let generate = new Generate()

const apiConfig = {
  tplPath: path.resolve(__dirname, './tpl/api.art'),
  outPath: path.resolve(__dirname, './dist/api.js'),
  databaseType: 'mysql',
  databaseConfig
}

const showViewConfig = {
  tplPath: path.resolve(__dirname, './tpl/onlyshowview.art'),
  outPath: path.resolve(__dirname, './dist/show.vue'),
  databaseType: 'mysql',
  databaseConfig
}

generate.setDatabase('mysql', databaseConfig)

async function run () {
  console.log('======开始======')
  try {
    await generate.createFile(apiConfig)
    await generate.createFile(showViewConfig)
  } catch (error) {
    console.log(error)
    return Promise.reject('生成失败')
  }
}

run().then(() => {
  console.log('======全部生成结束======')
})
