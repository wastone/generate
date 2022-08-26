export interface DatabaseConfig {
  /**
   * 主机名/IP
   */
  host: string,
  /**
   * 用户
   */
  user: string,
  /**
   * 密码
   */
  password: string,
  /**
   * 端口
   */
  port: number,
  /**
   * 数据库名称 （mysql）
   */
  database?: string,
  /**
   * 服务名或serverID （oracle）
   */
  serviceID?: string,
  /**
   * 表名（可不设置，不设置时需要在控制台根据提示输入）
   */
  table?: string
}

export interface TableColumnInfo {
  /**
   * 原列名 例如：create_time
   */
  name: string,
  /**
   * 驼峰格式的列名 例如：createTime
   */
  humpName: string,
  /**
   * 是否可为null
   */
  nullable: boolean,
  /**
   * 列数据格式
   */
  dataType: string,
  /**
   * 列注释
   */
  comment?: string,
  /**
   * 默认数据
   */
  dataDefault?: any,
  /**
   * 数据最大长度
   */
  maxLength?: number,
  /**
   * 是否为主键
   */
  isPrimary: boolean
}

export interface TableInfo {
  /**
   * 表列信息
   */
  column: TableColumnInfo[],
  /**
   * 表名
   */
  tableName: string,
  /**
   * 表注释
   */
  tableComment?: string

}

export interface Option {
  /**
   * 模板路径
   */
  tplPath: string,
  /**
   * 输出路径
   */
  outPath: string,
  /**
   * 自定义方法或数据
   */
  customTempUtils?: Record<string, any>
}
