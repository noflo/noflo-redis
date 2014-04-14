readenv = require "../components/Get"
socket = require('noflo').internalSocket
redis = require 'redis'

setupComponent = ->
  c = readenv.getComponent()
  ins = socket.createSocket()
  out = socket.createSocket()
  err = socket.createSocket()
  c.inPorts.key.attach ins
  c.outPorts.out.attach out
  c.outPorts.error.attach err
  [c, ins, out, err]

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
  [c, ins, out, err] = setupComponent()
  err.once 'data', (data) ->
    test.ok data
    test.ok data.message
    test.equals data.message, 'No value'
    test.equals data.key, 'testmissingkey'

  err.once 'disconnect', ->
    test.done()

  ins.send 'testmissingkey'
  ins.disconnect()

exports['test existing key'] = (test) ->
  [c, ins, out, err] = setupComponent()

  out.once 'data', (data) ->
    test.ok data
    test.equals data, 'baz'

  out.once 'disconnect', ->
    test.done()

  client.set 'newkey', 'baz', (err, reply) ->
    return test.done() if err
    created.push 'newkey'
    ins.send 'newkey'
    ins.disconnect()

exports['test multiple existing keys'] = (test) ->
  [c, ins, out, err] = setupComponent()

  out.once 'data', (data) ->
    test.ok data
    test.equals data, 'baz'

  out.once 'disconnect', ->
    out.once 'data', (data) ->
      test.ok data
      test.equals data, 'bar'
    out.once 'disconnect', ->
      test.done()

  client.set 'newkey', 'baz', (err, reply) ->
    return test.done() if err
    created.push 'newkey'
    client.set 'secondkey', 'bar', (err, reply) ->
      return test.done() if err
      created.push 'secondkey'
      ins.send 'newkey'
      ins.disconnect()
      ins.send 'secondkey'
      ins.disconnect()
