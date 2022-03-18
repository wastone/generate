import path from 'path'
import { nodeResolve } from '@rollup/plugin-node-resolve' // 依赖引用插件
import commonjs from '@rollup/plugin-commonjs' // commonjs模块转换插件
import eslint from '@rollup/plugin-eslint' // eslint插件
// import typescript from '@rollup/plugin-typescript'
import typescript from 'rollup-plugin-typescript2'
import alias from '@rollup/plugin-alias'
import nodePolyfills from 'rollup-plugin-polyfill-node'
const getPath = _path => path.resolve(__dirname, _path)
import packageJSON from './package.json'

// ts
const tsPlugin = typescript({
  tsconfig: getPath('./tsconfig.json'), // 导入本地ts配置
})

// eslint
const esPlugin = eslint({
  throwOnError: true,
  include: ['src/**/*.ts'],
  exclude: ['node_modules/**', 'lib/**']
})

// alias
const aliasPlugin = alias({
  entries: [
    { find: '@', replacement: getPath('./src') }
  ]
})

// 基础配置
const commonConf = {
  input: getPath('./src/index.ts'),
  plugins:[
    nodePolyfills(),
    aliasPlugin,
    nodeResolve({ preferBuiltins: true, extensions: ['.js', '.ts'] }),
    commonjs(),
    esPlugin,
    tsPlugin
  ]
}

// 需要导出的模块类型
const outputMap = [
  {
    file: packageJSON.main, // node模块
    format: 'umd',
  },
  {
    file: packageJSON.module, // es6模块
    format: 'es',
  }
]

export default outputMap.map(output => Object.assign({}, commonConf, { output: {name: packageJSON.name, ...output}}))
