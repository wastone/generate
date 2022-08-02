/**
 * 目标：
 *  - 支持批量生成
 *  - 支持多数据库
 *  - 支持可视化操作
 *  - vscode 插件支持
 */
const inquirer = require('inquirer')
const path = require('path')
const fs = require('fs')
const template = require("art-template")
const chalk = require("chalk")

// import { readFile } from "./utils/file"
import connectDatabase from '@/database'

import { DatabaseConfig, TableInfo, Option } from "types";
import { dotExistDirectoryCreate, generateFile } from './utils/file'
import * as utils from './utils'

const log = (message: string) => { console.log(chalk.blue(`${message}`)) }
const successLog = (message: string) => {console.log(chalk.green(`${message}`))}
const errorLog = (error: string) => {console.log(chalk.red(`${error}`))}

type DatabaseType = 'mysql' | 'oracle' | null

class Generate {

  private databaseType: DatabaseType | null = null
  private databaseConfig: DatabaseConfig | null = null
  private globalTempUtils: Record<string, any> | null = null

  constructor() {}

  /**
   * setDatabase  设置数据库信息
   */
  public setDatabase(databaseType: DatabaseType, databaseConfig: DatabaseConfig) {
    this.databaseType = databaseType
    this.databaseConfig = databaseConfig
  }

  /**
   * 设置模板全局公用对象
   */
  public setGlobalTempUtils (globalTempUtils: Record<string, any>) {
    this.globalTempUtils = globalTempUtils
  }

  /**
   * 根据配置生成文件
   * @param option 配置参数
   * @returns 
   */
  public async createFile(options: Option[]): Promise<Generate | never> {
    console.log('create start')
    const { databaseType, databaseConfig } = this
    const useDb = databaseType && databaseConfig

    if (databaseType && !databaseConfig) {
      errorLog('数据库配置databaseConfig不能为空，请使用setDatabase方法设置')
      throw new Error('数据库配置databaseConfig不能为空，请使用setDatabase方法设置')
    }

    if (!useDb && options.filter(v => !v.templateData).length > 0) {
      errorLog('数据库配置和模板数据必须配置一个')
      throw new Error('数据库配置和模板数据必须配置一个')
    }

    const tableInfo = useDb ? await this.getTemplateDataByDb() : undefined

    await this.createFileImpl(options, tableInfo)

    return this
  }

  private createFileImpl (options: Option[], tableInfo?: TableInfo): Promise<void> {
    return new Promise((resolve, reject) => {
      let count = 0

      const next =  async () => {
        const { tplPath, outPath, templateData, customTempUtils = {} } = options[count]

        // 校验模板路径
        const tplPathExists: boolean = fs.existsSync(tplPath)
        if (!tplPathExists) {
          errorLog(`模板路径${tplPath}不存在，请检查配置项tplPath`)
          throw new Error(`模板路径${tplPath}不存在，请检查配置项tplPath`)
        }
        const ext = path.extname(outPath)
        if (!ext) {
          errorLog('输出路径没有文件后缀，会造成未知错误，请检查配置outPath')
          throw new Error('输出路径没有文件后缀，会造成未知错误，请检查配置outPath')
        }


        log(`正在根据模板${path.basename(tplPath)}生成文件 ${outPath}`)
        try {
          // 递归生成目录
          const directory: string = path.dirname(outPath)
          await dotExistDirectoryCreate(directory)
          
          // 生成文件
          // 针对\{\{\}\}做一下处理
          const tempUtils = { ...customTempUtils, ...utils, ...(this.globalTempUtils || {}) }
          let tplData = template(tplPath, { tableInfo, templateData, utils: tempUtils})
          tplData = tplData.replace(/\\{\\{/g, '{{').replace(/\\}\\}/g, '}}')
          await generateFile(outPath, tplData)
          successLog(`生成文件${outPath}成功`)
          count++
          if (count >= options.length) {
            console.log('create end')
            resolve()
          } else {
            next()
          }
        } catch (error:any) {
          reject(error)
          error.message ? errorLog('生成失败，原因：' + error.message) : console.error(error)
          throw new Error(error)
        }
      }

      next()
    })
  }

  /**
   * 通过数据库获取信息
   */
  private async getTemplateDataByDb(): Promise<TableInfo> {
    const { databaseType, databaseConfig } = this
    if (!databaseConfig) {
      errorLog('数据库配置不能为空')
      throw new Error('数据库配置不能为空')
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
    const connect = databaseType === 'mysql' ? connectDatabase.mysqlConnect : connectDatabase.oracleConnect
    log(`正在连接数据库获取表信息，请稍候...`)
    const tableInfo = await connect(databaseConfig, tableName)
    successLog('获取数据库表信息成功')
    return tableInfo
  }
}

export default Generate
