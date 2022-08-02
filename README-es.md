# generate
[中文文档](README.md)

##### Generate files from template files and database tables
> Often used for development requirements with a large number of repetitive files.  For example, the background management system has a large part of the list page structure is similar, only add, delete, change and check related functions, you can take this library to solve this repetitive work.  

## Install

```bash
$ npm install -D @wlwastone/generate-file
```

## Features

- Generate files from template files and database table information
- If no database information is configured, you can render by customize data(option.templateData)，[Refer to the data format here(art-template>template>content)](https://aui.github.io/art-template/zh-cn/docs/api.html)
- Support queue generation of multiple files(See the index.js example below)

## Usage

###### Create a generate folder with the following directory structure
```
-- generate
  +-- tpl
  | +-- api.art
  | +-- showview.art
  --- index.js
```
The `tpl` directory is used to store template files. The template uses [art-template](https://aui.github.io/art-template/zh-cn/docs/syntax.html)

###### template example
> When database information is used, the returned information includes the infos below, which can be directly used in the template file.
```bash
// returned table info
{
  tableName: string,
  tableComment?: string,
  column: [{
    name: string,
    nullable: boolean,
    type: string,
    comment?: string,
    dataDefault?: any
  }]
}

// api.art exmaple
import * as http from '@/api'

export const add = (data) => {
  return http.postJson('/{{ tableName }}/add', data)
}

export const update = (data) => {
  return http.putJson('/{{ tableName }}/update', data)
}

export const del = (id) => {
  return http.delete(`/{{ tableName }}/updDel/${id}`)
}

export const getOne = (id) => {
  return http.get(`/{{ tableName }}/one/${id}`)
}
```

###### index.js complete example

```javascript
// gennerate/index.js

const path = require('path')
const Generate = require('@wastone/generate')


// instantiation (You can call directly without instantiation)
const generate = new Generate()

// Database configuration (Here is the oracle database configuration)
const databaseConfig = {
  user: 'test',           // database username (string)
  password: 'test',       // database password  (string)
  host: '127.0.0.1',      // database host/ip  (string)
  port: 21,               // database port (number)
  serviceID: 'test',     // oracle database SID(mysql database do not need configuration)
  database: ''           // mysql database name（oracle database do not need configuration）
}

// setDatabase(databaseType, databaseConfig)  databaseType: 'mysql' | 'oracle' | null
generate.setDatabase('oracle', databaseConfig)

// the first configuration
const apiConfig = {
  tplPath: path.resolve(__dirname, './tpl/api.art'),
  outPath: path.resolve(__dirname, './dist/api.js'),
  databaseType: 'oracle',
  databaseConfig,
  // templateData: { name: '1' } // support custom data (format: Object|string)
}

// the second configuration
const showViewConfig = {
  tplPath: path.resolve(__dirname, './tpl/showview.art'),
  outPath: path.resolve(__dirname, './dist/show.vue'),
  databaseType: 'oracle',
  databaseConfig
}

// custom function, support promise, createFile can be called multiple times to accommodate generating multiple files at once
async function run () {
  console.log('======start======')
  try {
    await generate.createFile(apiConfig)
    await generate.createFile(showViewConfig)
  } catch (error) {
    console.log(error)
    return Promise.reject('create failed')
  }
}

run().then(() => {
  console.log('======end======')
})
```
###### run
```
// Run commands in the generate root directory
node index
```

## TODO
- Vscode plugin support
- Support visual operation

## LICENSE
[MIT](https://github.com/liuxing/translator-cli/blob/master/LICENSE) @ wastone
