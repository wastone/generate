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
  nullable: boolean,
  dataType: string,
  comment?: string,
  dataDefault?: any
}

export interface TableInfo {
  column: TableColumnInfo[],
  tableName: string,
  tableComment?: string

}

export interface Option {
  tplPath: string,
  outPath: string,
  templateData?: Object | string
}
