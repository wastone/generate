(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
  typeof define === 'function' && define.amd ? define(factory) :
  (global = typeof globalThis !== 'undefined' ? globalThis : global || self, global["@wastone/generate"] = factory());
})(this, (function () { 'use strict';

  /**
   * 转换驼峰   a_ba  =>  aBa
   * @param str 要转换的源字符串
   * @param char 源字符串分隔字符
   * @returns
   */
  const convertToHump = (str, char = '_') => {
      if (!str)
          return '';
      str = str.toLocaleLowerCase();
      const reg = new RegExp(`(?:${char})(\\w)`, 'g');
      return str.replace(reg, ($0, $1) => $1.toLocaleUpperCase());
  };
  /**
   * 转换驼峰   a_ba  =>  aBa
   * @param str 要转换的源字符串
   * @param char 源字符串分隔字符
   * @returns
   */
  const convertToBigHump = (str, char = '_') => {
      if (!str)
          return '';
      str = convertToHump(str, char);
      return str[0].toLocaleUpperCase() + str.slice(1);
  };
  /**
   * 反向转换驼峰    aBa => a_ba
   * @param str 要转换的源字符串
   * @param char 源字符串分隔字符
   * @returns
   */
  const reConvertToHump = (str, char = '_') => {
      if (!str)
          return '';
      return str.replace(/[A-Z]/g, ($0) => char + $0.toLocaleLowerCase());
  };

  var utils = /*#__PURE__*/Object.freeze({
    __proto__: null,
    convertToHump: convertToHump,
    convertToBigHump: convertToBigHump,
    reConvertToHump: reConvertToHump
  });

  /**
   * @decription mysql数据库配置
   * @author wl
  */
  // import mysql from 'mysql'
  const mysql = require('mysql');
  /**
   * 请求数据库 查询表结构
   * @param {string} tableName 表名
   */
  const connectDatabase$2 = (config, tableName) => {
      return new Promise((resolve, reject) => {
          // 创建连接
          const connection = mysql.createConnection(config);
          connection.connect();
          connection.query(`
    SELECT 
    t.TABLE_NAME,
    t.TABLE_COMMENT,
    c.COLUMN_NAME,
    c.DATA_TYPE,
    c.IS_NULLABLE,
    c.COLUMN_COMMENT,
    c.COLUMN_DEFAULT,
    c.CHARACTER_MAXIMUM_LENGTH,
		c.COLUMN_KEY
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
    `, function (error, results) {
              if (error) {
                  reject(error);
                  throw error;
              }
              if (results.length === 0) {
                  // eslint-disable-next-line prefer-promise-reject-errors
                  reject({ message: '未查询到表信息，检查输入表名称是否正确' });
              }
              // 打印返回的表结构
              let column = [];
              let tableName = results[0].TABLE_NAME;
              let tableComment = results[0].TABLE_COMMENT;
              results.forEach((r) => {
                  column.push({
                      name: r.COLUMN_NAME,
                      humpName: convertToHump(r.COLUMN_NAME),
                      comment: r.COLUMN_COMMENT,
                      nullable: r.IS_NULLABLE === 'YES',
                      dataType: r.DATA_TYPE,
                      dataDefault: r.COLUMN_DEFAULT,
                      maxLength: r.CHARACTER_MAXIMUM_LENGTH,
                      isPrimary: r.COLUMN_KEY === 'PRI'
                  });
              });
              resolve({
                  column,
                  tableName,
                  tableComment
              });
          });
          connection.end((err) => {
              if (err)
                  throw err;
              console.log('连接数据库关闭');
          });
      });
  };

  /**
   * @decription oracle数据库配置
   * @author wl
   */
  const oracledb = require("oracledb");
  /**
   * 请求数据库 查询表结构
   * @param {string} tableName 表名
   */
  const connectDatabase$1 = (oracleConfig, tableName) => {
      return new Promise((resolve, reject) => {
          const config = {
              user: oracleConfig.user,
              password: oracleConfig.password,
              // IP:数据库IP地址，PORT:数据库端口，SCHEMA:数据库名称
              connectString: `${oracleConfig.host}:${oracleConfig.port}/${oracleConfig.serviceID}`,
          };
          oracledb.getConnection(config, function (err, connection) {
              if (err) {
                  console.error(err.message);
                  return;
              }
              // 查询某表一条数据测试，注意替换你的表名
              connection.execute(`SELECT
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
      AND ut.Table_Name = '${tableName}'`, function (err, result) {
                  if (err) {
                      console.error(err.message);
                      reject(err);
                      doRelease(connection);
                      return;
                  }
                  if (result.rows.length === 0) {
                      // eslint-disable-next-line prefer-promise-reject-errors
                      reject({ message: "未查询到表信息，检查输入表名称是否正确" });
                      return;
                  }
                  // 获取主键 TODO 待优化
                  connection.execute(`select cu.COLUMN_NAME from user_cons_columns cu, user_constraints au where cu.constraint_name = au.constraint_name and au.constraint_type = 'P' and au.table_name = '${tableName}'`, function (error, res) {
                      if (error) {
                          console.error(error.message);
                          reject(error);
                          doRelease(connection);
                          return;
                      }
                      if (res.rows.length === 0) {
                          // eslint-disable-next-line prefer-promise-reject-errors
                          reject({ message: '未查询到表信息，检查输入表名称是否正确' });
                          return;
                      }
                      const priColumnName = res.rows[0][0];
                      // 打印返回的表结构
                      let column = [];
                      let tableName = result.rows[0][0];
                      let tableComment = result.rows[0][1];
                      result.rows.forEach((r) => {
                          column.push({
                              name: r[2],
                              humpName: convertToHump(r[2]),
                              comment: r[3],
                              nullable: r[5] === 'Y',
                              dataType: r[4],
                              dataDefault: r[6],
                              maxLength: r[7] ? parseInt(r[7]) : 0,
                              isPrimary: priColumnName === r[2]
                          });
                      });
                      resolve({
                          column,
                          tableName,
                          tableComment
                      });
                  });
              });
          });
      });
  };
  function doRelease(connection) {
      connection.close(function (err) {
          if (err) {
              console.log("error1");
              console.error(err.message);
          }
          console.log("========= 关闭连接 ==========");
      });
  }

  var connectDatabase = {
      mysqlConnect: connectDatabase$2,
      oracleConnect: connectDatabase$1
  };

  const path$1 = require('path');
  const fs$1 = require('fs');
  // 递归创建目录
  function mkdirs(directory, callback) {
      var exists = fs$1.existsSync(directory);
      if (exists) {
          callback();
      }
      else {
          mkdirs(path$1.dirname(directory), function () {
              fs$1.mkdirSync(directory);
              callback();
          });
      }
  }
  // 创建目录
  function dotExistDirectoryCreate(directory) {
      return new Promise((resolve) => {
          mkdirs(directory, function () {
              resolve(true);
          });
      });
  }
  // 根据路径和数据写文件
  const generateFile = (path, data) => {
      return new Promise((resolve, reject) => {
          if (fs$1.existsSync(path)) {
              reject({ message: `${path}文件已存在` });
              return;
          }
          fs$1.writeFile(path, data, 'utf8', (err) => {
              if (err) {
                  reject(err);
              }
              else {
                  resolve(true);
              }
          });
      });
  };

  /**
   * 目标：
   *  - 支持批量生成
   *  - 支持多数据库
   *  - 支持可视化操作
   *  - vscode 插件支持
   */
  const inquirer = require('inquirer');
  const path = require('path');
  const fs = require('fs');
  const template = require("art-template");
  const chalk = require("chalk");
  const log = (message) => { console.log(chalk.blue(`${message}`)); };
  const successLog = (message) => { console.log(chalk.green(`${message}`)); };
  const errorLog = (error) => { console.log(chalk.red(`${error}`)); };
  class Generate {
      databaseType = null;
      databaseConfig = null;
      globalTempUtils = null;
      constructor() { }
      /**
       * setDatabase  设置数据库信息
       */
      setDatabase(databaseType, databaseConfig) {
          this.databaseType = databaseType;
          this.databaseConfig = databaseConfig;
      }
      /**
       * 设置模板全局公用对象
       */
      setGlobalTempUtils(globalTempUtils) {
          this.globalTempUtils = globalTempUtils;
      }
      /**
       * 根据配置生成文件
       * @param option 配置参数
       * @returns
       */
      async createFile(options) {
          console.log('create start');
          const { databaseType, databaseConfig } = this;
          if (!databaseType || !databaseConfig) {
              errorLog('数据库配置不能为空，请使用setDatabase方法设置');
              throw new Error('数据库配置，请使用setDatabase方法设置');
          }
          const tableInfo = await this.getTemplateDataByDb();
          await this.createFileImpl(options, tableInfo);
          return this;
      }
      createFileImpl(options, tableInfo) {
          return new Promise((resolve, reject) => {
              let count = 0;
              const next = async () => {
                  const { tplPath, outPath, customTempUtils = {} } = options[count];
                  // 校验模板路径
                  const tplPathExists = fs.existsSync(tplPath);
                  if (!tplPathExists) {
                      errorLog(`模板路径${tplPath}不存在，请检查配置项tplPath`);
                      throw new Error(`模板路径${tplPath}不存在，请检查配置项tplPath`);
                  }
                  const ext = path.extname(outPath);
                  if (!ext) {
                      errorLog('输出路径没有文件后缀，会造成未知错误，请检查配置outPath');
                      throw new Error('输出路径没有文件后缀，会造成未知错误，请检查配置outPath');
                  }
                  log(`正在根据模板${path.basename(tplPath)}生成文件 ${outPath}`);
                  try {
                      // 递归生成目录
                      const directory = path.dirname(outPath);
                      await dotExistDirectoryCreate(directory);
                      // 生成文件
                      // 针对\{\{\}\}做一下处理
                      const tempUtils = { ...customTempUtils, ...utils, ...(this.globalTempUtils || {}) };
                      let tplData = template(tplPath, { tableInfo, utils: tempUtils });
                      tplData = tplData.replace(/\\{\\{/g, '{{').replace(/\\}\\}/g, '}}');
                      await generateFile(outPath, tplData);
                      successLog(`生成文件${outPath}成功`);
                      count++;
                      if (count >= options.length) {
                          console.log('create end');
                          resolve();
                      }
                      else {
                          next();
                      }
                  }
                  catch (error) {
                      reject(error);
                      error.message ? errorLog('生成失败，原因：' + error.message) : console.error(error);
                      throw new Error(error);
                  }
              };
              next();
          });
      }
      /**
       * 通过数据库获取信息
       */
      async getTemplateDataByDb() {
          const { databaseType, databaseConfig } = this;
          if (!databaseConfig) {
              errorLog('数据库配置不能为空');
              throw new Error('数据库配置不能为空');
          }
          // 提示输入表名
          const { tableName } = await inquirer.prompt([
              {
                  type: 'input',
                  name: 'tableName',
                  message: '请输入要生成文件所用的表名，例如 SYS_LOG:',
                  validate: (value) => {
                      if (value.trim()) {
                          return true;
                      }
                      return '请输入要生成文件所用的表名，例如：SYS_LOG:';
                  }
              }
          ]);
          // 获取数据库表信息
          const connect = databaseType === 'mysql' ? connectDatabase.mysqlConnect : connectDatabase.oracleConnect;
          log(`正在连接数据库获取表信息，请稍候...`);
          const tableInfo = await connect(databaseConfig, tableName);
          successLog('获取数据库表信息成功');
          return tableInfo;
      }
  }

  return Generate;

}));
