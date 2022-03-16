
interface MysqlConfig {
  host: string,
  username: string,
  password: string,
  port: string,
  database: string
}

interface OracleConfig {
  host: string,
  username: string,
  password: string,
  port: string,
  serviceID: string
}

interface Option {
  tplPath: string,
  outPath: string,
  databaseType: 'mysql' | 'oracle',
  mysqlConfig?: MysqlConfig,
  oracleConfig?: OracleConfig
}
