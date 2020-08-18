import { FastifyLoggerInstance } from 'fastify'
import mysql from 'mysql'

import AppointmentManager from '../date/lib/AppointmentManager'

export async function setUpDatabase (t: any, log: FastifyLoggerInstance, databaseName: string) {
  const conn = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '1234',
  })
  t.tearDown(() => conn.end())

  await AppointmentManager.setUpDatabase(log, conn, databaseName)
}
