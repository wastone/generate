import { DatabaseConfig } from "./database";

export interface Option {
  tplPath: string,
  outPath: string,
  databaseType: 'mysql' | 'oracle',
  databaseConfig: DatabaseConfig
}
