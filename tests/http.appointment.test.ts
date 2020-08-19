import Fastify from 'fastify'
import t from 'tap'
import { v4 as uuidV4 } from 'uuid'

import index from '../index'

import { setUpDatabase, getDatabaseConnectionOption } from './utils'

t.test('appointments', async t => {
  const fastify = Fastify({ logger: { level: 'info' } })

  const databaseName = 'my-db-' + uuidV4()
  await setUpDatabase(t, fastify.log, databaseName)
  const username = 'my-username'

  const databaseConnectionOption = getDatabaseConnectionOption(databaseName)
  fastify.log.info(databaseConnectionOption)
  fastify.register(index, {
    mysql: {
      ...databaseConnectionOption,
      connectionLimit: 10
    },
    jwt: {
      secret: 'wow'
    }
  })
  t.tearDown(async () => { await fastify.close() })

  const loginResponse = await fastify.inject({
    method: 'POST',
    path: '/oauth/token',
    headers: {
      'content-type': 'application/x-www-form-urlencoded'
    },
    payload: 'grant_type=password&username=' + username + '&password=foo'
  })

  t.equals(loginResponse.statusCode, 200)
  const loginOutput = JSON.parse(loginResponse.payload)
  t.ok(loginOutput.access_token)

  const insertResponse = await fastify.inject({
    method: 'POST',
    path: '/appointments/',
    headers: {
      Authorization: 'Bearer ' + loginOutput.access_token
    },
    payload: {
      title: 'my-title',
      creatorId: 'my-creator-id',
      creatorUsername: 'my-creator-username',
      description: 'the description',
      startDate: new Date('2020-08-18T15:00:00Z').toISOString(),
      endDate: new Date('2020-08-18T16:00:00Z').toISOString()
    }
  })

  t.equals(insertResponse.statusCode, 200, insertResponse.payload)
  const insertOutput = JSON.parse(insertResponse.payload)
  t.equals(insertOutput.creatorUsername, username)
  t.ok(insertOutput.id)

  const fetchResponse = await fastify.inject({
    method: 'GET',
    path: '/appointments/' + insertOutput.id,
    headers: {
      Authorization: 'Bearer ' + loginOutput.access_token
    }
  })

  t.equals(fetchResponse.statusCode, 200, fetchResponse.payload)
  const fetchOutput = JSON.parse(fetchResponse.payload)
  t.equals(fetchOutput.id, insertOutput.id)

  const weekResponse = await fastify.inject({
    method: 'GET',
    path: '/appointments/year/2020/week/33',
    headers: {
      Authorization: 'Bearer ' + loginOutput.access_token
    }
  })

  t.equals(weekResponse.statusCode, 200, weekResponse.payload)
  const weekOutput = JSON.parse(weekResponse.payload)
  t.equals(weekOutput.length, 1)
  t.equals(weekOutput[0].id, insertOutput.id)

  const deleteResponse = await fastify.inject({
    method: 'DELETE',
    path: '/appointments/' + insertOutput.id,
    headers: {
      Authorization: 'Bearer ' + loginOutput.access_token
    }
  })

  t.equals(deleteResponse.statusCode, 204, deleteResponse.payload)

  const fetch2Response = await fastify.inject({
    method: 'GET',
    path: '/appointments/' + insertOutput.id,
    headers: {
      Authorization: 'Bearer ' + loginOutput.access_token
    }
  })

  t.equals(fetch2Response.statusCode, 404, fetch2Response.payload)

  t.end()
})
