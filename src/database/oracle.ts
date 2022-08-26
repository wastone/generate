/**
 * @decription oracle数据库配置
 * @author wl
 */
const oracledb = require("oracledb");
import { convertToHump } from "@/utils/index";
import { DatabaseConfig, TableColumnInfo, TableInfo } from "types";

/**
 * 连接数据库
 * @param oracleConfig: DatabaseConfig
 * @returns Promise<any>
 */
function connect (oracleConfig: DatabaseConfig): Promise<any> {
  return new Promise((resolve, reject) => {
    const config = {
      user: oracleConfig.user,
      password: oracleConfig.password,
      // IP:数据库IP地址，PORT:数据库端口，SCHEMA:数据库名称
      connectString: `${oracleConfig.host}:${oracleConfig.port}/${oracleConfig.serviceID}`,
    };
    oracledb.getConnection(config, function (err: any, connection: any) {
      if (err) {
        console.error(err.message);
        reject(err);
        return;
      }
      resolve(connection);
    });
  });
};
// 执行sql
function execSql (connection: any, sqlStr: string): Promise<any> {
  return new Promise((resolve, reject) => {
    connection.execute(sqlStr, function (err: any, result: any) {
      if (err) {
        console.error(err.message);
        reject(err);
        doRelease(connection);
        return;
      }
      resolve(result);
    });
  });
};


function doRelease(connection: any) {
  connection.close(function (err: any) {
    if (err) {
      console.log("error1");
      console.error(err.message);
    }
    console.log("========= 关闭连接 ==========");
  });
}
/**
 * 请求数据库 查询表结构
 * @param {string} tableName 表名
 */
const connectDatabase = (
  oracleConfig: DatabaseConfig,
  tableName: string
): Promise<TableInfo> => {
  return new Promise(async (resolve, reject) => {
    const connection = await connect(oracleConfig);
    // 获取表结构
    const result = await execSql(
      connection,
      `SELECT
          ut.TABLE_NAME,
          uc.comments,
          ut.COLUMN_NAME,
          ucc.comments,
          ut.DATA_TYPE,
          ut.NULLABLE,
          ut.DATA_DEFAULT,
          ut.CHAR_COL_DECL_LENGTH
        FROM
          user_tab_columns ut,
          user_tab_comments uc,
          user_col_comments ucc
        WHERE
          ut.TABLE_NAME = uc.TABLE_NAME
        AND ut.column_name = ucc.column_name
        AND UT.TABLE_NAME = ucc.TABLE_NAME
        AND ut.Table_Name = '${tableName}'`
    );

    if (result.rows.length === 0) {
      // eslint-disable-next-line prefer-promise-reject-errors
      reject({ message: "未查询到表信息，检查输入表名称是否正确" });
      return;
    }
    // 获取主键 TODO 待优化
    const res = await execSql(
      connection,
      `select cu.COLUMN_NAME from user_cons_columns cu, user_constraints au where cu.constraint_name = au.constraint_name and au.constraint_type = 'P' and au.table_name = '${tableName}'`
    );

    if (res.rows.length === 0) {
      // eslint-disable-next-line prefer-promise-reject-errors
      reject({ message: "未查询到表信息，检查输入表名称是否正确" });
      doRelease(connection);
      return;
    }
    const priColumnName = res.rows[0][0];
    // 打印返回的表结构
    let column: TableColumnInfo[] = [];
    result.rows.forEach((r: string[]) => {
      column.push({
        name: r[2],
        humpName: convertToHump(r[2]),
        comment: r[3],
        nullable: r[5] === "Y",
        dataType: r[4],
        dataDefault: r[6],
        maxLength: r[7] ? parseInt(r[7]) : 0,
        isPrimary: priColumnName === r[2],
      });
    });
    resolve({
      column,
      tableName: result.rows[0][0],
      tableComment: result.rows[0][1],
    });
  });
};

/**
 * 获取数据库所有表信息，用于展示表列表，比如vscode插件中需要先展示
 */
export const getTableList = (oracleConfig: DatabaseConfig) => {
  return new Promise(async (resolve, reject) => {
    const connection = await connect(oracleConfig);
    // 获取表结构
    const result = await execSql(
      connection,
      `SELECT
          *
        FROM
        user_tab_comments`
    );

    if (result.rows.length === 0) {
      // eslint-disable-next-line prefer-promise-reject-errors
      reject({ message: "未查询到表信息，检查输入名称是否正确" });
      doRelease(connection);
      return;
    }

    // 打印返回的表结构
    let column: any[] = result.rows.map((r: string[]) => ({
      tableName: r[0],
      comment: r[1],
    }));
    resolve(column);
  });
};

export default connectDatabase;
