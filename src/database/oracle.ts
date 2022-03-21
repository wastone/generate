/**
 * @decription oracle数据库配置
 * @author wl
*/
const oracledb = require('oracledb')
import { convertToHump } from '@/utils/index'
import { DatabaseConfig, TableColumnInfo, TableInfo } from 'types'
/**
 * 请求数据库 查询表结构
 * @param {string} tableName 表名
 */
const connectDatabase = (oracleConfig: DatabaseConfig, tableName: string): Promise<TableInfo> => {
  return new Promise((resolve, reject) => {
    const config = {
      user: oracleConfig.user,
      password: oracleConfig.password,
      // IP:数据库IP地址，PORT:数据库端口，SCHEMA:数据库名称
      connectString: `${oracleConfig.host}:${oracleConfig.port}/${oracleConfig.serviceID}`
    }
    oracledb.getConnection(
      config,
      function (err: any, connection: any) {
        if (err) {
          console.error(err.message)
          return
        }
        // 查询某表一条数据测试，注意替换你的表名
        connection.execute(`SELECT
        ut.TABLE_NAME,
        uc.comments,
        ut.COLUMN_NAME,
        UCC.comments
      FROM
        user_tab_columns ut,
        user_tab_comments uc,
        user_col_comments ucc
      WHERE
        ut.TABLE_NAME = uc.TABLE_NAME
      AND ut.column_name = ucc.column_name
      AND UT.TABLE_NAME = UCC.TABLE_NAME
      AND ut.Table_Name = '${tableName}'`,
        function (err: any, result: any) {
          if (err) {
            console.error(err.message)
            reject(err)
            doRelease(connection)
            return
          }
          if (result.rows.length === 0) {
            // eslint-disable-next-line prefer-promise-reject-errors
            reject({ message: '未查询到表信息，检查输入表名称是否正确' })
            return
          }
          // 打印返回的表结构
          let column:TableColumnInfo[] = []
          let tableName = convertToHump(result.rows[0][0])
          let tableComment = convertToHump(result.rows[0][1])
          result.rows.forEach((r:string[]) => {
            column.push({
              name: convertToHump(r[2]),
              comment: r[3]
            })
          })
          resolve({
            column,
            tableName,
            tableComment
          })
        })
      })
  })
}

function doRelease (connection: any) {
  connection.close(
    function (err: any) {
      if (err) {
        console.log('error1')
        console.error(err.message)
      }
      console.log('========= 关闭连接 ==========')
    })
}

export default connectDatabase
