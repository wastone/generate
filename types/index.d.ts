export interface DatabaseConfig {
  host: string,
  user: string,
  password: string,
  port: number,
  database?: string,
  serviceID?: string
}

export interface TableColumnInfo {
  name: string,
  humpName: string,
  nullable: boolean,
  dataType: string,
  comment?: string,
  dataDefault?: any,
  maxLength?: number
}

export interface TableInfo {
  column: TableColumnInfo[],
  tableName: string,
  tableComment?: string

}

export interface Option {
  tplPath: string,
  outPath: string,
  templateData?: Object | string,
  /**
   * 自定义方法 
   */
  customTempUtils?: Record<string, any>
}
