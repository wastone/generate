// generateView.js
const chalk = require('chalk')
const path = require('path')
const fs = require('fs')
const inquirer = require('inquirer')
const resolve = (...file) => path.resolve(__dirname, ...file)
const log = message => console.log(chalk.green(`${message}`))
const successLog = message => console.log(chalk.blue(`${message}`))
const errorLog = error => console.log(chalk.red(`${error}`))
const { vueTemplate } = require('./temp/view-tpl')
const { onlyShowVueTemplate } = require('./temp/onlyshowview-tpl')
const { apiTemplate } = require('./temp/api-tpl')

// 生成文件
const generateFile = (path, data) => {
  if (fs.existsSync(path)) {
    errorLog(`${path}文件已存在`)
    return
  }
  return new Promise((resolve, reject) => {
    fs.writeFile(path, data, 'utf8', err => {
      if (err) {
        errorLog(err.message)
        reject(err)
      } else {
        resolve(true)
      }
    })
  })
}

const nextView = async (answers, option) => {
  // connectdb function
  const connectDatabase = option.dbType === 'mysql' ? require('./database/mysql') : require('./database/oracle')

  let inputComponentName = answers.viewName
  let inputTableName = answers.tableName
  let viewType = answers.viewType
  let isCreateApi = answers.isCreateApi
  try {
    // 读取数据库表信息
    let tableInfo = await connectDatabase(inputTableName, option.dbConfig)
    /**
     * Vue页面组件路径
     */
    let componentVueName = resolve('../src/views', inputComponentName)
    // 如果不是以 .vue 结尾的话，自动加上
    if (!componentVueName.endsWith('.vue')) {
      componentVueName += '.vue'
    }
    /**
     * vue组件目录路径
     */
    const componentDirectory = path.dirname(componentVueName)
    // 检查路径文件是否已存在
    const hasComponentExists = fs.existsSync(componentVueName)
    if (hasComponentExists) {
      errorLog(`${inputComponentName}页面组件已存在，请重新输入`)
    } else {
      log(`正在生成 views 目录 ${componentDirectory}`)
      await dotExistDirectoryCreate(componentDirectory)
    }
    let componentName = ''
    if (inputComponentName.includes('/')) {
      const inputArr = inputComponentName.split('/')
      componentName = inputArr[inputArr.length - 1]
    } else {
      componentName = inputComponentName
    }
    if (componentName.indexOf('.vue') > -1) {
      componentName = componentName.slice(0, -4)
    }
    log(`正在生成 vue 文件 ${componentVueName}, 对应表名为 ${tableInfo.tableName}`)
    let tplData = null
    if (viewType === '只有查看功能') {
      tplData = option.onlyShowVueTemplate(componentName, tableInfo)
    } else {
      tplData = option.vueTemplate(componentName, tableInfo)
    }
    await generateFile(componentVueName, tplData)
    successLog(`生成vue 文件 ${componentVueName}成功`)
    if ((!isCreateApi || isCreateApi === 'yes') && viewType !== '只有查看功能') {
      log(`正在生成 api 文件 ${componentVueName}, 对应表名为 ${tableInfo.tableName}`)
      /**
       * api路径
       */
      let filePath = inputComponentName.indexOf('.vue') > -1 ? inputComponentName.replace('.vue', '.js') : inputComponentName + '.js'
      let apiPath = resolve('../src/api', filePath)

      const hasApiExists = fs.existsSync(apiPath)
      const apiDirectory = path.dirname(apiPath)
      if (hasApiExists) {
        errorLog(`${apiPath}已存在，请重新输入`)
      } else {
        log(`正在生成 api 目录 ${apiDirectory}`)
        await dotExistDirectoryCreate(apiDirectory)
      }
      await generateFile(apiPath, option.apiTemplate(componentName, tableInfo, inputComponentName))
      successLog(`生成 api 文件 ${apiPath}成功`)
    }
  } catch (e) {
    errorLog(e.message)
  }
}

function dotExistDirectoryCreate (directory) {
  return new Promise((resolve) => {
    mkdirs(directory, function () {
      resolve(true)
    })
  })
}

// 递归创建目录
function mkdirs (directory, callback) {
  var exists = fs.existsSync(directory)
  if (exists) {
    callback()
  } else {
    mkdirs(path.dirname(directory), function () {
      fs.mkdirSync(directory)
      callback()
    })
  }
}



const GenerateView = (option) => {
  // default option
  const defaultOption = {
    dbType: 'mysql',
    dbConfig: {
      host: '192.168.2.190',
      user: 'school',
      password: 'zzdxwl2204',
      port: '3306',
      database: 'his_boss'
    },
    vueTemplate: vueTemplate,
    onlyShowVueTemplate: onlyShowVueTemplate,
    apiTemplate: apiTemplate
  }
  // extend defaultoption and option
  option = Object.assign({}, defaultOption, option)

  // commonder question
  inquirer.prompt([
    {
      type: 'input',
      name: 'viewName',
      message: '请输入要生成的页面组件名称、会生成在 views/目录下:',
      validate: (value) => {
        if (value.trim()) {
          return true
        }
        return '请输入要生成的页面组件名称:'
      }
    },
    {
      type: 'list',
      name: 'viewType',
      message: '请选择生成页面的功能:',
      choices: ['全部功能', '只有查看功能'],
      default: '全部功能'
    },
    {
      type: 'input',
      name: 'isCreateApi',
      message: '是否生成api文件:',
      choices: ['yes', 'no'],
      default: 'yes'
    },
    {
      type: 'input',
      name: 'tableName',
      message: '请输入要生成的页面所用的表名，例如 SYS_LOG:',
      validate: (value) => {
        if (value.trim()) {
          return true
        }
        return '请输入要生成的页面所用的表名，例如：SYS_LOG:'
      }
    }
  ]).then(answers => {
    nextView(answers, option)
  })
  
  process.stdin.on('end', () => {
    log('exit')
    process.exit()
  })
}

module.exports = GenerateView
