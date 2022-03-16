export const convertToHump = (str: string, char = '_') => {
  if (!str) return ''
  str = str.toLocaleLowerCase()
  let arr = []
  let strArr = str.split(char)
  for (let i = 0; i < strArr.length; i++) {
    let a = strArr[i]
    if (i > 0) {
      a = strArr[i].slice(0, 1).toLocaleUpperCase() + strArr[i].slice(1)
    }
    arr.push(a)
  }
  return arr.join('')
}
