/**
 * 目标：
 *  - 支持批量生成
 *  - 支持多数据库
 *  - 支持可视化操作
 *  - vscode 插件支持
 */
import inquirer from 'inquirer'

import * as fileUtil from "./utils/file"
import connectDatabase from '@/database'

class Generate {
  // 配置参数
  private option: Option

  constructor(option: Option) {
    this.option = option
    this.run()
  }

  public async run(): Promise<void> {
    const { tplPath, outPath, databaseType, mysqlConfig, oracleConfig } = this.option
    console.log(this.option)
    console.log(fileUtil)
    console.log(connectDatabase)
    // 提示输入表名
    const { tableName } = await inquirer.prompt([
      {
        type: 'input',
        name: 'tableName',
        message: '请输入要生成文件所用的表名，例如 SYS_LOG:',
        validate: (value: string) => {
          if (value.trim()) {
            return true
          }
          return '请输入要生成文件所用的表名，例如：SYS_LOG:'
        }
      }
    ])
    // 获取数据库表信息
    const databaseConfig = databaseType === 'mysql' ? mysqlConfig : oracleConfig
    const connect = databaseType === 'mysql' ? connectDatabase.mysqlConnect : connectDatabase.oracleConnect
    const tableInfo = await connect(databaseConfig, tableName)
    console.log(tableInfo)
    console.log(tplPath)
    console.log(outPath)
  }
}

export default Generate
