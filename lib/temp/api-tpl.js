/*
 * @descripte： api模板
 * @Author: WL
 * @Date: 2019-09-26 08:57:55
 * @Last Modified by: WL
 * @Last Modified time: 2020-06-30 17:00:40
 */

module.exports = {
  apiTemplate: (viewName, tableInfo) => {
    return `import * as http from '@/api'

// 新增
export const add = (data) => {
  return http.postJson('/${tableInfo.tableName}/add', data)
}

// 更新
export const update = (data) => {
  return http.putJson('/${tableInfo.tableName}/update', data)
}

// 删除
export const del = (id) => {
  return http.putJson(\`/${tableInfo.tableName}/updel/\${id}\`)
}

// 查询
export const getOne = (id) => {
  return http.get(\`/${tableInfo.tableName}/one/\${id}\`)
}
`
  }
}
