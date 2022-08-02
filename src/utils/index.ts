/**
 * 转换驼峰   a_ba  =>  aBa
 * @param str 要转换的源字符串
 * @param char 源字符串分隔字符
 * @returns 
 */
export const convertToHump = (str: string, char = '_') => {
  if (!str) return '';
  str = str.toLocaleLowerCase();
  const reg = new RegExp(`(?:${char})(\\w)`, 'g');
  return str.replace(reg, ($0, $1) => $1.toLocaleUpperCase());
}

/**
 * 反向转换驼峰    aBa => a_ba
 * @param str 要转换的源字符串
 * @param char 源字符串分隔字符
 * @returns
 */
 export const reConvertToHump = (str: string, char = '_') => {
  if (!str) return '';
  return str.replace(/[A-Z]/g, ($0) => char + $0.toLocaleLowerCase());
}
