# generate
[英文文档](README-es.md)|中文文档

##### 根据模板文件和数据库表生成文件(目前支持mysql和oracle数据库)
> 常用于大量重复性文件的开发需求。比如后台管理系统有很大一部分列表页面结构都类似，只有增删改查相关功能，可以借此库解决此重复性工作。

## 特性

- 根据模板文件和数据库表信息生成文件
- 支持自定义模板用方法对象
- 支持生成多文件（参考下面index.js示例）

## 安装

```bash
// 使用mysql数据库时
$ npm install mysql -S
// 使用oracle数据库时
$ npm install oracledb -S

$ npm install -D @wastone/generate
```

## 使用方法

###### 创建generate文件夹，示例目录结构如下
```
-- generate
  +-- tpl
  | +-- api.art
  | +-- showview.art
  --- index.js
```
`tpl`目录存放模板文件，模板采用`art-template`，相应语法参考[这里](https://aui.github.io/art-template/zh-cn/docs/syntax.html)

###### 实例化
```
const Generate = require('@wastone/generate')

// 实例化
const generate = new Generate()
```
###### `generate`暴露出的方法为
- `setDatabase(databaseType: DatabaseType, databaseConfig: DatabaseConfig):void` 设置数据库信息
```typescript
type DatabaseType = 'mysql' | 'oracle'

interface DatabaseConfig {
  host: string, // ip
  user: string, // 用户名
  password: string, // 密码
  port: number, // 端口
  database?: string, // 表名（mysql用）
  serviceID?: string // 服务名（oracle用）
}
```
- `setGlobalTempUtils(globalTempUtils: Record<string, any>):void` 设置模板全局公用对象 会合并到`utils`对象
```typescript
type DatabaseType = 'mysql' | 'oracle'

interface DatabaseConfig {
  host: string, // ip
  user: string, // 用户名
  password: string, // 密码
  port: number, // 端口
  database?: string, // 数据库名（mysql用）
  serviceID?: string // 服务名（oracle用）
}
```
- `createFile(options: Option[]):Promise<Generate>` 主方法，根据配置生成文件
```typescript
interface Option {
  tplPath: string,
  outPath: string,
  /**
   * 自定义模板全局对象,会合并到utils对象
   */
  customTempUtils?: Record<string, any>
}
```

###### 具体使用方法

```javascript
// gennerate/index.js

// 新版nodejs后，有些库不支持直接require，可以采用这个方式引用
import { createRequire } from 'module';
const require = createRequire(import.meta.url);

const path = require('path')
const Generate = require('../lib/index')

import { fileURLToPath } from 'url'
const filename = fileURLToPath(import.meta.url) // 这里不能声明__filename,因为已经有内部的__filename了，重复声明会报错
const __dirname = path.dirname(filename)

/*=========== 自己的数据库配置 ================*/
 const databaseConfig = {
   user: '**',
   password: '**',
   host: '192.168.2.**',
   port: 3306,
   serviceID: '',
   database: 'login_log'
 }

function test11 () {
  return 'test11'
}
function test22 () {
  return 'test22'
}

let generate = new Generate()

// 设置数据库信息
generate.setDatabase('mysql', databaseConfig)

// 设置模板全局方法对象 所有模板文件可用
generate.setGlobalTempUtils({
  test11
})

const apiConfig = {
  tplPath: path.resolve(__dirname, './tpl/api.art'),
  outPath: path.resolve(__dirname, './dist/api.js'),
  // 单独模板自定义方法对象，只能使用到这个模板
  customTempUtils: {
    test22
  }
}

const showViewConfig = {
  tplPath: path.resolve(__dirname, './tpl/onlyshowview.art'),
  outPath: path.resolve(__dirname, './dist/show.vue')
}

async function run () {
  console.log('======开始======')
  try {
    await generate.createFile([apiConfig, showViewConfig])
  } catch (error) {
    console.log(error)
    return Promise.reject('生成失败')
  }
}

run().then(() => {
  console.log('======全部生成结束======')
})

```

###### 模板文件示例
> 模板中可用的属性和方法

`tableInfo`: 返回的数据库信息
```typescript
// 返回数据库信息
interface tableInfo {
  tableName: string, // 表名称
  tableComment?: string, // 表注释
  column: [{
    name: string,      // 列名称
    humpName: string,  // 驼峰的列名称(默认以下划线转换) a_bb => aBb
    nullable: boolean,  // 是否可以为null
    dataType: string,      // 数据类型
    comment?: string,   // 注释
    dataDefault?: any,  // 默认值
    maxLength?: number  // 数据最大长度
  }]
}
```
`utils`: 可在模板中使用的方法对象。内置两个函数`convertToHump(str: string, char = '_')`  转驼峰 `a_bbb_ccc => aBbbCcc`,  `reConvertToHump(str: string, char = '_')` 反转驼峰  `aBbbCcc => a_bbb_ccc`，可自定义添加方法和对象，上面介绍的`setGlobalTempUtils`和 `customTempUtils`定义的对象会合并到这里。
```typescript
interface Utils {
  convertToHump: (str: string, char: string) => string
  reConvertToHump: (str: string, char: string) => string
  [key: string]: any
  // ... 其他自定义，通过setGlobalTempUtils和customTempUtils自定义
}
```

**在模板中使用方法（可参考下方模板示例）**
```
// 在模板中使用
{{ tableInfo.tableName }}
{{ utils.convertToHump('a_bbb_ccc') }}
{{ utils.reConvertToHump('aBbbCcc') }}
```


```javascript
// api.art 示例
import * as http from '@/api'

// 新增
export const add = (data) => {
  return http.postJson('/{{ tableInfo.tableName }}/add', data)
}

// 更新
export const update = (data) => {
  return http.putJson('/{{ tableInfo.tableName }}/update', data)
}

// 删除
export const del = (id) => {
  return http.delete(`/{{ tableInfo.tableName }}/updDel/${id}`)
}

// 查询
export const getOne = (id) => {
  return http.get(`/{{ tableInfo.tableName }}/one/${id}`)
}
```
```html
// onlyshowview.art 
<template>
  <div class="{{viewName}}-page">
    <div class="{{viewName}}-page-content">
      <div class="search-container">
        {{each tableInfo.column}}
        <label>{{$value.comment}}</label>
        <el-input v-model="listQuery.{{$value.humpName}}" placeholder="{{$value.comment}}" class="search-item input-m" size="mini"></el-input>
        {{/each}}
        <el-button type="primary" icon="el-icon-search" size="mini" @click="search">
          查询
        </el-button>
      </div>
      <st-table
      ref="sttable"
      url="/{{viewName}}/page"
      :query="listQuery"
      :isAutoRender="false"
      :paging="true"
      :column="tableInfo"
      :index="true">
        <template slot="{{tableInfo.column[0].name}}" slot-scope="scope">
          <el-button
            @click="show(scope)"
            size="mini">
            查看
          </el-button>
        </template>
      </st-table>
    </div>
    <!-- show-dialog s-->
    <el-dialog class="show-dialog" title="信息查看" :visible.sync="showDialogVisible">
      <el-form size="small" label-width="105px" label-position="left">
        {{each tableInfo.column}}
        <el-form-item label="{{$value.comment}}">
          <span>\{\{rowData.{{$value.humpName}}\}\}</span>
        </el-form-item>
        {{/each}}
      </el-form>
      <div slot="footer" class="dialog-footer">
        <el-button @click="showDialogVisible = false" size="small">关 闭</el-button>
      </div>
    </el-dialog>
    <!-- show-dialog e-->
  </div>
</template>
<script>

export default {
  name: '{{viewName}}',
  data () {
    return {
      tableInfo: [
        {{each tableInfo.column}}
        { prop: '{{$value.humpName}}', label: '{{$value.comment}}' },
        {{/each}}
        { prop: '{{tableInfo.column[0].name}}', label: '操作', width: 240, scope: true }
      ],
      listQuery: {
        {{each tableInfo.column}}
        {{$value.humpName}}: null,
        {{/each}}
      },
      showDialogVisible: false,
      rowData: {}
    }
  },
  methods: {
    search () {
      this.$refs.sttable.reload()
    },
    show (scope) {
      this.rowData = scope.row
      this.showDialogVisible = true
    }
  }
}
</script>

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
