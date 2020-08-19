import { FastifyLoggerInstance } from 'fastify'
import { v4 as uuidV4 } from 'uuid';
import mysql from 'mysql'

import User from '../../types/User'

export interface Appointment {
  id?: string;
  startDate: Date;
  endDate: Date;
  title: string;
  description: string;
  creatorId?: string;
  creatorUsername?: string;
}

export default class AppointmentManager {
  private mysqlPool: mysql.Pool

  constructor (mysqlPool: mysql.Pool) {
    this.mysqlPool = mysqlPool
  }

  async insertAppointment(log: FastifyLoggerInstance, user: User, appointment: Appointment): Promise<Appointment> {
    const appointmentOnDatabase = {
      ...appointment,
      creatorId: user.id,
      creatorUsername: user.username,
      id: uuidV4()
    }
    await exec(this.mysqlPool, log, 'INSERT INTO appointments SET ?;', appointmentOnDatabase)
    return appointmentOnDatabase
  }

  async getAppointment(log: FastifyLoggerInstance, user: User, id: string): Promise<Appointment> {
    const results = await execSelect(
      this.mysqlPool,
      log,
      'SELECT * from appointments WHERE id=? AND deletedAt IS NULL AND creatorId = ? LIMIT 1;',
      [id, user.id]
    )
    if (results.length === 0) {
      throw new Error('NOT_FOUND')
    }
    return mapAnyToAppointment(results[0])
  }

  async getAppointmentsByWeek(log: FastifyLoggerInstance, user: User, year: number, weekNumber: number): Promise<Array<Appointment>> {
    const firstMondayOfYear = AppointmentManager.getStartDayOfWeek(year, weekNumber)
    const secondMondayOfYear = new Date(firstMondayOfYear)
    secondMondayOfYear.setUTCDate(secondMondayOfYear.getUTCDate() + 7)
    
    
    const results = await execSelect(
      this.mysqlPool,
      log,
      'SELECT * from appointments WHERE startDate >= ? AND startDate < ?  AND deletedAt IS NULL AND creatorId = ?;',
      [firstMondayOfYear, secondMondayOfYear, user.id]
    )
    return results
      .map(mapAnyToAppointment)
  }

  async cancelAppointment(log: FastifyLoggerInstance, user: User, id: string): Promise<void> {
    const { results } = await exec(
      this.mysqlPool,
      log,
      'UPDATE appointments SET deletedAt = ? WHERE id = ? AND deletedAt IS NULL AND creatorId = ?;',
      [new Date(), id, user.id]
    )
    if (results.affectedRows !== 1) {
      throw new Error('NOT_FOUND')
    }
  }

  static getStartDayOfWeek(year: number, weekNumber: number) {
    const firstDayOfYear = new Date(`${year}-01-01T00:00:00Z`)
    const diff = (7 - firstDayOfYear.getDay() + 1) % 7
    
    const firstMondayOfYear = firstDayOfYear
    firstMondayOfYear.setUTCDate(firstMondayOfYear.getUTCDate() + diff)

    // Skip first weekNumber - 1 weeks
    firstMondayOfYear.setUTCDate(firstMondayOfYear.getUTCDate() + (weekNumber - 1) * 7)

    return firstMondayOfYear
  }

  /* istanbul ignore next */
  static async setUpDatabase (log: FastifyLoggerInstance, conn: mysql.Connection, databaseName: string) {
    return new Promise(async (resolve, reject) => {
      try {
        await exec(conn, log, 'CREATE DATABASE ??', [databaseName])
      } catch (e) {
        console.log('ERRROR in getting connection', e)
        reject(e)
        return
      }
  
      conn.changeUser({
        database: databaseName,
      }, async err => {
        if (err) {
          reject(err)
          return
        }
        try {
          await exec(conn, log, `CREATE TABLE ?? (
            id CHAR(36) NOT NULL,
            title VARCHAR(50) NOT NULL,
            description VARCHAR(255) NOT NULL,
            startDate DATETIME NOT NULL,
            endDate DATETIME NOT NULL,
            creatorId VARCHAR(255) NOT NULL,
            creatorUsername VARCHAR(255) NOT NULL,
            deletedAt DATETIME
          )
            CHARACTER SET utf8mb4
            COLLATE utf8mb4_unicode_ci
          ;`, ['appointments'])
        } catch (e) {
          console.log(e)
          reject(err)
          return
        }

        resolve()
      })
    })
  }
}

interface QueryResult {
  results: any;
  fields: any;
  q: mysql.Query;
}

function exec (mysqlPool: mysql.Pool | mysql.Connection, log: FastifyLoggerInstance, query: string, data: any): Promise<QueryResult> {
  return new Promise((resolve, reject) => {
    log.trace({ query, data })
    const q = mysqlPool.query(query, data, function (error, results, fields) {
      /* istanbul ignore next */
      if (error) {
        reject(error)
        return
      }
      resolve({
        results,
        fields,
        q,
      })
    })
    log.trace({ sql: q.sql })
  })
}


function execSelect (mysqlPool: mysql.Pool | mysql.Connection, log: FastifyLoggerInstance, query: string, data: any): Promise<any> {
  return new Promise((resolve, reject) => {
    log.trace({ query, data })
    const q = mysqlPool.query(query, data)

    let results: any[] = []
    q.on('result', d => {
      results.push({
        id: d.id,
        creatorId: d.creatorId,
        creatorUsername: d.creatorUsername,
        description: d.description,
        endDate: d.endDate,
        startDate: d.startDate,
        title: d.title,
      })
    })
    .on(
      'error',
      /* istanbul ignore next */
      error => {
        console.log('error', error)
        reject(error)
      })
    .on('end', function() {
      resolve(results)
    })
  })
}

function mapAnyToAppointment(d: any): Appointment {
  return {
    id: d.id,
    creatorId: d.creatorId,
    creatorUsername: d.creatorUsername,
    description: d.description,
    endDate: d.endDate,
    startDate: d.startDate,
    title: d.title,
  }
}