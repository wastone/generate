
import mysqlConnect, { getTableList as getMysqlTableList } from './mysql'
import oracleConnect, { getTableList as getOracleTableList } from './oracle'

export default {
  mysqlConnect,
  oracleConnect,
  getMysqlTableList,
  getOracleTableList
}