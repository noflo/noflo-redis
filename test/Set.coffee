readenv = require "../components/Set"
socket = require('noflo').internalSocket
redis = require 'redis'

setupComponent = ->
  c = readenv.getComponent()
  key = socket.createSocket()
  val = socket.createSocket()
  out = socket.createSocket()
  err = socket.createSocket()
  c.inPorts.key.attach key
  c.inPorts.value.attach val
  c.outPorts.out.attach out
  c.outPorts.error.attach err
  [c, key, val, out, err]

created = null
client = null
exports.setUp = (done) ->
  client = redis.createClient()
  created = []
  done()
exports.tearDown = (done) ->
  todo = created.length
  finished = ->
    client.end()
    done()

  return finished() if todo is 0
  for key in created
    client.del key, ->
      todo--
      finished() if todo is 0

exports['test a missing key'] = (test) ->
  [c, key, val, out, err] = setupComponent()
  err.once 'data', (data) ->
    test.ok data
    test.ok data.message
    test.equals data.message, 'No key defined'

  err.once 'disconnect', ->
    test.done()

  val.send 'testmissingkey'
  val.disconnect()

exports['test setting a key'] = (test) ->
  [c, key, val, out, err] = setupComponent()
  out.once 'data', (data) ->
    test.equals data, 'OK'
    created.push 'testset'
    client.get 'testset', (err, reply) ->
      return test.done() if err
      test.equals reply, 'foo'
      test.done()

  key.send 'testset'
  val.send 'foo'
  val.disconnect()

exports['test setting multiple keys'] = (test) ->
  [c, key, val, out, err] = setupComponent()
  out.once 'data', (data) ->
    test.equals data, 'OK'
    created.push 'testfirst'
    out.once 'data', (data) ->
      test.equals data, 'OK'
      created.push 'testsecond'
      client.get 'testfirst', (err, reply) ->
        return test.done() if err
        test.equals reply, 'foo'
        client.get 'testsecond', (err, reply) ->
          return test.done() if err
          test.equals reply, 'bar'
          test.done()

  key.send 'testfirst'
  val.send 'foo'
  key.send 'testsecond'
  val.send 'bar'
  val.disconnect()
