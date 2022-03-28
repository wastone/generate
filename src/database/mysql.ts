/**
 * @decription mysql数据库配置
 * @author wl
*/

// import mysql from 'mysql'
const mysql = require('mysql')
import { convertToHump } from '@/utils/index'
import { DatabaseConfig, TableColumnInfo, TableInfo } from 'types'

/**
 * 请求数据库 查询表结构
 * @param {string} tableName 表名
 */
const connectDatabase = (config: DatabaseConfig, tableName: string): Promise<TableInfo> => {
  return new Promise((resolve, reject) => {
    // 创建连接
    const connection = mysql.createConnection(config)

    connection.connect()

    connection.query(`
    SELECT 
    t.TABLE_NAME,
    t.TABLE_COMMENT,
    c.COLUMN_NAME,
    c.DATA_TYPE,
    c.IS_NULLABLE,
    c.COLUMN_COMMENT,
    c.COLUMN_DEFAULT 
    FROM 
    information_schema.TABLES t,
    INFORMATION_SCHEMA.Columns c 
    WHERE
    t.TABLE_SCHEMA = '${config.database}'
    and
    c.TABLE_SCHEMA = '${config.database}'
    and
    t.TABLE_NAME = '${tableName}'
    and
    c.TABLE_NAME = '${tableName}'
    `, function (error: any, results: any) {
      if (error) {
        reject(error)
        throw error
      }
      if (results.length === 0) {
        // eslint-disable-next-line prefer-promise-reject-errors
        reject({ message: '未查询到表信息，检查输入表名称是否正确' })
      }
      // 打印返回的表结构
      let column:TableColumnInfo[] = []
      let tableName = convertToHump(results[0].TABLE_NAME)
      let tableComment = convertToHump(results[0].TABLE_COMMENT)
      results.forEach((r:any) => {
        column.push({
          name: convertToHump(r.COLUMN_NAME),
          comment: r.COLUMN_COMMENT,
          nullable: r.IS_NULLABLE === 'YES'? true : false,
          dataType: r.DATA_TYPE,
          dataDefault: r.COLUMN_DEFAULT
        })
      })
      resolve({
        column,
        tableName,
        tableComment
      })
    })
    connection.end((err: any) => {
      if (err) throw err
      console.log('连接数据库关闭')
    })
  })
}

export default connectDatabase
