import { FastifyLoggerInstance } from 'fastify'
import mysql from 'mysql'

import AppointmentManager from '../appointment/lib/AppointmentManager'

export async function setUpDatabase (t: any, log: FastifyLoggerInstance, databaseName: string) {
  const conn = mysql.createConnection({
    host: process.env.MYSQL_HOST || 'localhost',
    user: 'root',
    password: '1234',
    port: Number(process.env.MYSQL_PORT || '3306')
  })
  t.tearDown(() => conn.end())

  await AppointmentManager.setUpDatabase(log, conn, databaseName)
}

export function getDatabaseConnectionOption (databaseName: string) {
  return {
    host: process.env.MYSQL_HOST || 'localhost',
    user: 'root',
    password: '1234',
    port: Number(process.env.MYSQL_PORT || '3306'),
    database: databaseName
  }
}
