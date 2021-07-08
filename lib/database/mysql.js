/**
 * @decription mysql数据库配置
 * @author wl
*/
const mysql = require('mysql')
const tool = require('./tool')

const config = {
  host: '192.168.2.190',
  user: 'school',
  password: 'zzdxwl2204',
  port: '3306',
  database: 'his_boss'
}

/**
 * 请求数据库 查询表结构
 * @param {string} tableName 表名
 */
const connectDatabase = (tableName, config) => {
  return new Promise((resolve, reject) => {
    // 创建连接
    const connection = mysql.createConnection(config)

    connection.connect()

    connection.query(`
    SELECT 
    t.TABLE_NAME,
    t.TABLE_COMMENT,
    c.COLUMN_NAME,
    c.COLUMN_TYPE,
    c.COLUMN_COMMENT 
    FROM 
    information_schema.TABLES t,
    INFORMATION_SCHEMA.Columns c 
    WHERE 
    t.TABLE_NAME = '${tableName}'
    and
    c.TABLE_NAME = '${tableName}'
    `, function (error, results, fields) {
      if (error) {
        reject(error)
        throw error
      }
      if (results.length === 0) {
        // eslint-disable-next-line prefer-promise-reject-errors
        reject({ message: '未查询到表信息，检查输入表名称是否正确' })
      }
      // 打印返回的表结构
      let column = []
      let tableName = tool.convertToHump(results[0].TABLE_NAME)
      let tableComment = tool.convertToHump(results[0].TABLE_COMMENT)
      results.forEach(r => {
        column.push({
          name: tool.convertToHump(r.COLUMN_NAME),
          comment: r.COLUMN_COMMENT
        })
      })
      resolve({
        column,
        tableName,
        tableComment
      })
    })
    connection.end(err => {
      if (err) throw err
      console.log('连接数据库关闭')
    })
  })
}

module.exports = connectDatabase
