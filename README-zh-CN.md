# @wastone/generate
[英文文档](README.md)|中文文档

##### 根据模板文件和数据库表生成文件
> 常用于大量重复性文件的开发需求。比如后台管理系统有很大一部分列表页面结构都类似，只有增删改查相关功能，可以借此库解决此重复性工作。

## 安装

```bash
// 适用于开发模式
$ npm install -D @wlwastone/generate-file
```

## 特性

- 根据模板文件和数据库表信息生成文件
- 如不配置数据库信息，支持自定义数据（option.templateData）渲染，数据格式参考[art-template中template函数的参数content](https://aui.github.io/art-template/zh-cn/docs/api.html)
- 支持队列生成多文件（参考下面index.js示例）

## 使用方法

###### 创建generate文件夹，目录结构如下
```
-- generate
  +-- tpl
  | +-- api.art
  | +-- showview.art
  --- index.js
```
`tpl`目录存放模板文件，模板采用`art-template`，相应语法参考[这里](https://aui.github.io/art-template/zh-cn/docs/syntax.html)

###### 模板文件示例
> 采用数据库信息时，返回的信息包含 `tableName` 表名称、`tableComment` 表注释、`column`表列信息，可在模板文件中直接使用
```
// 数据库信息
{
  tableName: string,
  tableComment?: string,
  column: [{
    name: string,      // 列名称
    nullable: boolean,  // 是否可以为null
    dataType: string,      // 数据类型 number | varchar | int | datetime等
    comment?: string,   // 注释
    dataDefault?: any  // 默认值
  }]
}

// api.art 示例
import * as http from '@/api'

// 新增
export const add = (data) => {
  return http.postJson('/{{ tableName }}/add', data)
}

// 更新
export const update = (data) => {
  return http.putJson('/{{ tableName }}/update', data)
}

// 删除
export const del = (id) => {
  return http.delete(`/{{ tableName }}/updDel/${id}`)
}

// 查询
export const getOne = (id) => {
  return http.get(`/{{ tableName }}/one/${id}`)
}
```

###### index.js完整示例

```bash
// gennerate/index.js

const path = require('path')
const Generate = require('@wastone/generate')


// 实例化（可不实例化，直接调用）
const generate = new Generate()

// 数据库配置参数
const databaseConfig = {
  user: 'test',           // 数据库用户名 string
  password: 'test',       // 数据库密码  string
  host: '127.0.0.1',  // 数据库host/ip  string
  port: 21,               // 数据库端口 number
  serviceID: 'test',     // oracle数据库 服务名/SID（mysql数据库不配置）
  database: ''           // mysql数据库名（oracle数据库不配置）
}

// 配置数据库setDatabase(databaseType, databaseConfig)  databaseType: 'mysql' | 'oracle' | null
generate.setDatabase('oracle', databaseConfig)

// 配置一
const apiConfig = {
  tplPath: path.resolve(__dirname, './tpl/api.art'),
  outPath: path.resolve(__dirname, './dist/api.js'),
  databaseType: 'oracle',
  databaseConfig,
  // templateData: { name: '1' } // 支持自定义数据 Object,string
}

// 配置二
const showViewConfig = {
  tplPath: path.resolve(__dirname, './tpl/showview.art'),
  outPath: path.resolve(__dirname, './dist/show.vue'),
  databaseType: 'oracle',
  databaseConfig
}

// 自定义执行函数  支持promise  可以多次调用createFile以适应一次生成多个文件
async function run () {
  console.log('======开始======')
  try {
    await generate.createFile(apiConfig)
    await generate.createFile(showViewConfig)
  } catch (error) {
    console.log(error)
    return Promise.reject('生成失败')
  }
}

run().then(() => {
  console.log('======全部生成结束======')
})
```
###### 运行
```
// 在generate根目录下命令运行
node index
```

## TODO
- vscode 插件支持
- 可视化操作支持

## LICENSE
[MIT](https://github.com/liuxing/translator-cli/blob/master/LICENSE) @ wastone
