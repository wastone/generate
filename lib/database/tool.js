/*
 * @Descripttion: 模板用工具类
 * @Author: WL
 * @Date: 2019-09-12 11:07:43
 * @LastEditors: WL
 * @LastEditTime: 2019-09-12 11:26:03
 */
/**
 * 根据下划线转换为驼峰 a_ba => aBa
 * @param {string} str
 */
const convertToHump = (str, char = '_') => {
  if (!str) return ''
  str = str.toLocaleLowerCase()
  let arr = []
  str = str.split(char)
  for (let i = 0; i < str.length; i++) {
    let a = str[i]
    if (i > 0) {
      a = str[i].slice(0, 1).toLocaleUpperCase() + str[i].slice(1)
    }
    arr.push(a)
  }
  return arr.join('')
}

module.exports = {
  convertToHump
}
