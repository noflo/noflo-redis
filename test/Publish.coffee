readenv = require "../components/Publish"
socket = require('noflo').internalSocket
redis = require 'redis'

setupComponent = ->
  c = readenv.getComponent()
  chan = socket.createSocket()
  msg = socket.createSocket()
  out = socket.createSocket()
  err = socket.createSocket()
  c.inPorts.channel.attach chan
  c.inPorts.message.attach msg
  c.outPorts.out.attach out
  c.outPorts.error.attach err
  [c, chan, msg, out, err]

client = null
exports.setUp = (done) ->
  client = redis.createClient()
  done()
exports.tearDown = (done) ->
  client.end()
  client = null
  done()

exports['test a regular channel'] = (test) ->
  [c, chan, msg, out, err] = setupComponent()

  chan.send 'regularchannel'
  client.subscribe 'regularchannel'

  client.on 'message', (channel, message) ->
    test.ok message
    test.equals message, 'Hello, there!'
    client.unsubscribe()
    test.done()

  client.on 'subscribe', ->
    msg.send 'Hello, there!'
    msg.disconnect()

exports['test a wildcard channel'] = (test) ->
  [c, chan, msg, out, err] = setupComponent()

  chan.send 'wildchannel.foo'
  client.psubscribe 'wildchannel.*'

  client.on 'pmessage', (pattern, channel, message) ->
    test.ok message
    test.equals channel, 'wildchannel.foo'
    test.equals message, 'Hello, there!'
    client.punsubscribe()
    test.done()

  client.on 'psubscribe', ->
    msg.send 'Hello, there!'
    msg.disconnect()
