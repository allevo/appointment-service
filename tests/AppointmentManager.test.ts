import t from 'tap'
import pino from 'pino'
import mysql from 'mysql'
import { v4 as uuidV4 } from 'uuid'
import AppointmentManager, { Appointment } from '../date/lib/AppointmentManager'

import { setUpDatabase } from './utils'

t.test('AppointmentManager', async t => {
  const databaseName = 'my-db-' + uuidV4()
  const log = pino({ level: 'trace' })
  await setUpDatabase(t, log, databaseName)

  const pool = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: '1234',
    database: databaseName,
  })
  t.tearDown(() => pool.end())
  const appointmentManager = new AppointmentManager(pool)

  t.test('insertAppointment', async t => {
    const appointment = {
      title: 'my-title',
      creatorId: 'my-creator-id',
      creatorUsername: 'my-creator-username',
      description: 'the description',
      startDate: new Date('2020-08-18T15:00:00Z'),
      endDate: new Date('2020-08-18T16:00:00Z'),
    }
    const appointmentOnDatabase = await appointmentManager.insertAppointment(log, appointment)

    t.test('should return the correct object', t => {
      t.ok(appointmentOnDatabase.id)
      t.equals(appointmentOnDatabase.title, appointment.title)
      t.equals(appointmentOnDatabase.description, appointment.description)
      t.equals(appointmentOnDatabase.creatorUsername, appointment.creatorUsername)
      t.equals(appointmentOnDatabase.creatorId, appointment.creatorId)
      t.strictDeepEquals(appointmentOnDatabase.startDate, appointment.startDate)
      t.strictDeepEquals(appointmentOnDatabase.endDate, appointment.endDate)
      t.end()
    })

    t.test('can be retrieved by getAppointment', async t => {
      const fetchedAppointment = await appointmentManager.getAppointment(log, appointmentOnDatabase.id!)

      t.test('should fetch the correct object', t => {
        t.equal(fetchedAppointment.id, appointmentOnDatabase.id)
        t.equals(fetchedAppointment.title, appointment.title)
        t.equals(fetchedAppointment.description, appointment.description)
        t.equals(fetchedAppointment.creatorUsername, appointment.creatorUsername)
        t.equals(fetchedAppointment.creatorId, appointment.creatorId)
        t.strictDeepEquals(fetchedAppointment.startDate, appointment.startDate)
        t.strictDeepEquals(fetchedAppointment.endDate, appointment.endDate)
        t.end()
      })

      t.end()
    })
    t.end()
  })

  t.test('getAppointment', t => {
    t.test('should reject if not found', async t => {
      try {
        await appointmentManager.getAppointment(log, 'unknown-appointment-id')
        t.fail()
      } catch(e) {
        t.strictDeepEquals(e, new Error('NOT_FOUND'))
      }

      t.end()
    })
    t.end()
  })

  t.test('getStartDayOfWeek', t => {
    t.test('first week', t => {
      let date
      date = AppointmentManager.getStartDayOfWeek(2020, 1)
      t.strictDeepEquals(date, new Date('2020-01-06T00:00:00Z'))
  
      date = AppointmentManager.getStartDayOfWeek(2019, 1)
      t.strictDeepEquals(date, new Date('2019-01-07T00:00:00Z'))
  
      date = AppointmentManager.getStartDayOfWeek(2018, 1)
      t.strictDeepEquals(date, new Date('2018-01-01T00:00:00Z'))
  
      date = AppointmentManager.getStartDayOfWeek(2017, 1)
      t.strictDeepEquals(date, new Date('2017-01-02T00:00:00Z'))
    
      t.end()
    })

    t.test('third week', t => {
      let date
      date = AppointmentManager.getStartDayOfWeek(2020, 3)
      t.strictDeepEquals(date, new Date('2020-01-20T00:00:00Z'))

      t.end()
    })

    t.end()
  })

  t.test('getAppointmentsByWeek', async t => {
    const baseAppointment = {
      title: 'my-title',
      creatorId: 'my-creator-id',
      creatorUsername: 'my-creator-username',
      description: 'the description',
      startDate: new Date('2020-08-18T15:00:00Z'),
      endDate: new Date('2020-08-18T16:00:00Z'),
    }
    const dates = [
      // out: before
      new Date('2019-12-31T23:59:59Z'),
      new Date('2020-01-01T00:00:00Z'),
      // in
      new Date('2020-01-06T00:00:00Z'),
      new Date('2020-01-07T00:00:00Z'),
      new Date('2020-01-12T00:00:00Z'),
      new Date('2020-01-12T23:59:59Z'),
      // out: after
      new Date('2020-01-13T00:00:00Z'),
    ]
    const appointmentsOnDatabase: Array<Appointment> = []
    for (let date of dates) {
      appointmentsOnDatabase.push(await appointmentManager.insertAppointment(log, { ...baseAppointment, startDate: date }))
    }

    t.test('return the list', async t => {
      const appointments = await appointmentManager.getAppointmentsByWeek(log, 2020, 1)

      t.strictDeepEquals(appointments.map(a => a.id), [
        appointmentsOnDatabase[2].id,
        appointmentsOnDatabase[3].id,
        appointmentsOnDatabase[4].id,
        appointmentsOnDatabase[5].id,
      ])
      
      t.end()
    })
    t.end()
  })

  t.test('cancelAppointment', async t => {
    const targetAppointment = {
      title: 'my-title',
      creatorId: 'my-creator-id',
      creatorUsername: 'my-creator-username',
      description: 'the description',
      startDate: new Date('2020-08-18T15:00:00Z'),
      endDate: new Date('2020-08-18T16:00:00Z'),
    }
    const appointmentOnDatabase = await appointmentManager.insertAppointment(log, targetAppointment)
    await appointmentManager.cancelAppointment(log, appointmentOnDatabase.id!)

    try {
      await appointmentManager.getAppointment(log, appointmentOnDatabase.id!)
      t.fail()
    } catch (e) {
      t.strictDeepEquals(e, new Error('NOT_FOUND'))
    }

    t.test('should reject if appointment is not found', async t => {
      try {
        await appointmentManager.cancelAppointment(log, appointmentOnDatabase.id!)
        t.fail()
      } catch (e) {
        t.strictDeepEquals(e, new Error('NOT_FOUND'))
      }

      t.end()
    })

    t.end()
  })

  t.end()
})
