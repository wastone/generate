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
  comment?: string
}

export interface TableInfo {
  column: TableColumnInfo[],
  tableName: string,
  tableComment?: string

}
