import { FastifyInstance, FastifyPlugin } from 'fastify'
import mysql from 'mysql'

import AppointmentManager, { Appointment } from './lib/AppointmentManager'

import CreateBodySchema from './schemas/create_date_body.json'
import { CreateBodySchema as CreateBodySchemaInterface } from './types/create_date_body'


export interface MysqlPluginOption {
  connectionLimit: number,
  host: string,
  user: string,
  password: string,
  database: string,
}


const datePlugin: FastifyPlugin<any> = function (server: FastifyInstance, ops: any, done: Function) {
  const pool  = mysql.createPool({
    connectionLimit: ops.connectionLimit,
    host: ops.host,
    user: ops.user,
    password: ops.password,
    database: ops.database
  });
  server.addHook('onClose', (_, done) => pool.end(done))

  const appointmentManager = new AppointmentManager(pool)

  server.post<{
    Body: CreateBodySchemaInterface
  }>('/', {
    schema: {
      body: CreateBodySchema,
    },
    handler: async (request, reply) => {
      const user = await server.getUser(request)

      const appointment = <Appointment>{
        title: request.body.title,
        description: request.body.description,
        startDate: new Date(request.body.startDate),
        endDate: new Date(request.body.endDate),
        creatorId: user.id,
        creatorUsername: user.username
      }

      await appointmentManager.insertAppointment(request.log, appointment)
      
      return user
    }
  })

  done()
}

module.exports = datePlugin
export default datePlugin
