import pino from 'pino'
import mysql from 'mysql'

import AppointmentManager from '../appointment/lib/AppointmentManager'

export async function setUpDatabase (databaseName: string) {
  const conn = mysql.createConnection({
    host: process.env.MYSQL_HOST || 'localhost',
    user: 'root',
    password: '1234',
    port: Number(process.env.MYSQL_PORT || '3306')
  })

  const log = pino({ level: 'info' })
  await AppointmentManager.setUpDatabase(log, conn, databaseName)

  conn.end()
}

setUpDatabase('my-db')
