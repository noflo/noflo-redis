delkey = require "../components/Del"
socket = require('noflo').internalSocket
redis = require 'redis'

setupComponent = ->
  c = delkey.getComponent()
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
  groups = []
  out.on 'begingroup', (data) ->
    groups.push data
  out.on 'endgroup', (data) ->
    groups.pop()
  out.once 'data', (data) ->
    test.equals data, 'testmissingkey'
    test.equals groups.length, 2
    test.equals groups[0], 'foo'
  out.once 'disconnect', ->
    test.done()

  ins.beginGroup 'foo'
  ins.beginGroup 'bar'
  ins.send 'testmissingkey'
  ins.endGroup()
  ins.endGroup()
  ins.disconnect()

exports['test existing key'] = (test) ->
  [c, ins, out, err] = setupComponent()

  out.once 'data', (data) ->
    test.ok data
    test.equals data, 'newkey'

  out.once 'disconnect', ->
    test.done()

  client.set 'newkey', 'baz', (err, reply) ->
    return test.done() if err
    created.push 'newkey'
    ins.send 'newkey'
    ins.disconnect()
