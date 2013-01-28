readenv = require "../components/Subscribe"
socket = require('noflo').internalSocket
redis = require 'redis'

setupComponent = ->
  c = readenv.getComponent()
  chan = socket.createSocket()
  out = socket.createSocket()
  err = socket.createSocket()
  c.inPorts.channel.attach chan
  c.outPorts.out.attach out
  c.outPorts.error.attach err
  [c, chan, out, err]

client = null
exports.setUp = (done) ->
  client = redis.createClient()
  done()
exports.tearDown = (done) ->
  client.end()
  client = null
  done()

exports['test a regular subscription'] = (test) ->
  [c, chan, out, err] = setupComponent()
  out.once 'data', (data) ->
    test.ok data
    test.equals data, 'Hello, there!'

  out.once 'disconnect', ->
    c.redis.unsubscribe()
    client.end()
    test.done()

  c.on 'subscribe', ->
    client.publish 'regularchannel', 'Hello, there!'

  chan.send 'regularchannel'
  chan.disconnect()

exports['test a wildcard subscription'] = (test) ->
  [c, chan, out, err] = setupComponent()
  test.expect 3

  out.once 'begingroup', (data) ->
    test.equals data, 'wildchannel.foo'

  out.once 'data', (data) ->
    test.ok data
    test.equals data, 'Hello, there!'

  out.once 'disconnect', ->
    c.redis.punsubscribe()
    client.end()
    test.done()

  c.on 'psubscribe', ->
    client.publish 'wildchannel.foo', 'Hello, there!'

  chan.send 'wildchannel.*'
  chan.disconnect()
