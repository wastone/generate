const path = require('path')
const Generate = require('@wastone/generate')

const databaseConfig = {
  user: 'dyq',
  password: 'zzdxwl2204',
  host: '192.168.2.190',
  port: 1521,
  serviceID: 'TIMETRS'
}

// new Generate({
//   tplPath: path.resolve(__dirname, './tpl/api.art'),
//   outPath: path.resolve(__dirname, './dist/api.js'),
//   databaseType: 'oracle',
//   databaseConfig
// })

new Generate({
  tplPath: path.resolve(__dirname, './tpl/onlyshowview.art'),
  outPath: path.resolve(__dirname, './dist/show.vue'),
  databaseType: 'oracle',
  databaseConfig
})