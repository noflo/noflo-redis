noflo = require 'noflo'
redis = require 'redis'

unless noflo.isBrowser()
  chai = require 'chai'
  path = require 'path'
  baseDir = path.resolve __dirname, '../'
else
  baseDir = 'noflo-redis'

describe 'Subscribe component', ->
  c = null
  chan = null
  out = null
  err = null
  client = null
  before (done) ->
    @timeout 4000
    loader = new noflo.ComponentLoader baseDir
    loader.load 'redis/Subscribe', (err, instance) ->
      return done err if err
      c = instance
      chan = noflo.internalSocket.createSocket()
      c.inPorts.channel.attach chan
      client = redis.createClient()
      done()
  after (done) ->
    client.quit()
    done()
  beforeEach ->
    out = noflo.internalSocket.createSocket()
    c.outPorts.out.attach out
    err = noflo.internalSocket.createSocket()
    c.outPorts.error.attach err
  afterEach ->
    c.outPorts.out.detach out
    out = null
    c.outPorts.error.detach err
    err = null

  describe 'with a fully-qualified channel name', ->
    it 'should receive the message', (done) ->
      groups = []
      received = false
      out.on 'begingroup', (group) ->
        groups.push group
      out.on 'data', (data) ->
        chai.expect(data).to.equal 'Hello, there!'
        chai.expect(groups).to.eql [
          'regularchannel'
        ]
        received = true
      out.on 'endgroup', ->
        groups.pop()
      out.on 'disconnect', ->
        chai.expect(received).to.equal true
        c.redis.punsubscribe()
        done()
      c.on 'subscribe', ->
        client.publish 'regularchannel', 'Hello, there!'
      chan.send 'regularchannel'
      chan.disconnect()

  describe 'with a wildcard channel', ->
    it 'should receive the message', (done) ->
      groups = []
      received = false
      out.on 'begingroup', (group) ->
        groups.push group
      out.on 'data', (data) ->
        chai.expect(data).to.equal 'Hello, there!'
        chai.expect(groups).to.eql [
          'wildchannel.foo'
        ]
        received = true
      out.on 'endgroup', ->
        groups.pop()
      out.on 'disconnect', ->
        chai.expect(received).to.equal true
        c.redis.punsubscribe()
        done()
      c.on 'psubscribe', ->
        client.publish 'wildchannel.foo', 'Hello, there!'
      chan.send 'wildchannel.*'
      chan.disconnect()
