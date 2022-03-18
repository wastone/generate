/**
 * 转换驼峰   a_ba  =>  aBa
 * @param str 要转换的源字符串
 * @param char 源字符串分隔字符
 * @returns 
 */
export const convertToHump = (str: string, char = '_') => {
  if (!str) return ''
  str = str.toLocaleLowerCase()
  let arr = []
  let strArr = str.split(char)
  for (let i = 0; i < strArr.length; i++) {
    let a = strArr[i]
    if (i > 0) {
      a = strArr[i][0].toLocaleUpperCase() + strArr[i].slice(1)
    }
    arr.push(a)
  }
  return arr.join('')
}
