const path = require('path')
const Generate = require('@wastone/generate')

const databaseConfig = {
  user: 'dyq',
  password: 'zzdxwl2204',
  host: '192.168.2.190',
  port: 1521,
  serviceID: 'TIMETRS'
}
let generate = new Generate()

const apiConfig = {
  tplPath: path.resolve(__dirname, './tpl/api.art'),
  outPath: path.resolve(__dirname, './dist/api.js'),
  databaseType: 'oracle',
  databaseConfig
}

const showViewConfig = {
  tplPath: path.resolve(__dirname, './tpl/onlyshowview.art'),
  outPath: path.resolve(__dirname, './dist/show.vue'),
  databaseType: 'oracle',
  databaseConfig
}

generate.setDatabase('oracle', databaseConfig)

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
