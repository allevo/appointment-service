import Fastify from 'fastify'
import t from 'tap'

import index from '../index'

t.test('login', async t => {
  const fastify = Fastify()
  fastify.register(index, {
    jwt: { secret: 'wow' }
  })

  const username = 'my-username'
  
  const loginResponse = await fastify.inject({
    method: 'POST',
    path: '/auth',
    headers: {
      'content-type': 'application/x-www-form-urlencoded'
    },
    payload: 'grant_type=password&username=' + username + '&password=foo'
  })

  t.equals(loginResponse.statusCode, 200)
  const loginOutput = JSON.parse(loginResponse.payload)
  t.ok(loginOutput.access_token)


  const meResponse = await fastify.inject({
    method: 'GET',
    path: '/me',
    headers: {
      'Authorization': 'Bearer ' + loginOutput.access_token
    }
  })

  t.equals(meResponse.statusCode, 200, meResponse.payload)
  const meOutput = JSON.parse(meResponse.payload)
  t.equals(meOutput.username, username)
  t.ok(meOutput.id)

  t.end()
})
