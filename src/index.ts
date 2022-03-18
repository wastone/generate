/**
 * 目标：
 *  - 支持批量生成
 *  - 支持多数据库
 *  - 支持可视化操作
 *  - vscode 插件支持
 */
// import inquirer from 'inquirer'
const inquirer = require('inquirer')
const path = require('path')
const fs = require('fs')
const template = require("art-template")
const chalk = require("chalk")

// import { readFile } from "./utils/file"
import connectDatabase from '@/database'

import { Option } from 'types'
import { dotExistDirectoryCreate, generateFile } from './utils/file'

const log = (message: string) => { console.log(chalk.blue(`${message}`)) }
const successLog = (message: string) => {console.log(chalk.green(`${message}`))}
const errorLog = (error: string) => {console.log(chalk.red(`${error}`))}

class Generate {
  // 配置参数
  private option: Option

  constructor(option: Option) {
    this.option = option
    this.run()
  }

  public async run(): Promise<void> {
    const { tplPath, outPath, databaseType, databaseConfig } = this.option
    // 校验模板路径
    const tplPathExists: boolean = fs.existsSync(tplPath)
    if (!tplPathExists) {
      errorLog(`模板路径${tplPath}不存在，请检查配置项tplPath`)
      return
    }
    const ext = path.extname(outPath)
    if (!ext) {
      errorLog('输出路径没有文件后缀，请检查配置outPath')
      return
    }
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
    if (!databaseConfig) {
      errorLog('数据库配置databaseConfig不能为空')
      return
    }
    const connect = databaseType === 'mysql' ? connectDatabase.mysqlConnect : connectDatabase.oracleConnect
    log(`正在连接数据库获取表信息，请稍候...`)
    const tableInfo = await connect(databaseConfig, tableName)
    successLog('获取数据库表信息成功')

    log(`正在根据模板${path.basename(tplPath)}生成文件 ${outPath}`)
    try {
      // 递归生成目录
      const directory: string = path.dirname(outPath)
      await dotExistDirectoryCreate(directory)
      
      // 生成文件
      // 针对\{\{\}\}做一下处理
      let tplData = template(tplPath, tableInfo)
      tplData = tplData.replace(/\\{\\{/g, '{{').replace(/\\}\\}/g, '}}')
      await generateFile(outPath, tplData)
      successLog(`生成文件${outPath}成功`)
    } catch (error:any) {
      error.message ? errorLog('生成失败，原因：' + error.message) : console.error(error)
    }
  }
}

export default Generate
