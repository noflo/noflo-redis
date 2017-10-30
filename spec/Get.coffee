noflo = require 'noflo'
redis = require 'redis'

unless noflo.isBrowser()
  chai = require 'chai'
  path = require 'path'
  baseDir = path.resolve __dirname, '../'
else
  baseDir = 'noflo-redis'

describe 'Get component', ->
  c = null
  ins = null
  out = null
  err = null
  created = []
  client = null
  before (done) ->
    @timeout 4000
    loader = new noflo.ComponentLoader baseDir
    loader.load 'redis/Get', (err, instance) ->
      return done err if err
      c = instance
      ins = noflo.internalSocket.createSocket()
      c.inPorts.key.attach ins
      client = redis.createClient()
      clientSocket = noflo.internalSocket.createSocket()
      c.inPorts.client.attach clientSocket
      clientSocket.send client
      done()
  after (done) ->
    client.quit done
  beforeEach ->
    out = noflo.internalSocket.createSocket()
    c.outPorts.out.attach out
    err = noflo.internalSocket.createSocket()
    c.outPorts.error.attach err
  afterEach (done) ->
    c.outPorts.out.detach out
    out = null
    c.outPorts.error.detach err
    err = null
    remove = ->
      return done() unless created.length
      key = created.shift()
      client.del key, (err) ->
        return done err if err
        do remove
    do remove

  describe 'with a missing key', ->
    it 'should send an error', (done) ->
      groups = []
      received = false
      err.on 'begingroup', (data) ->
        groups.push data
      err.on 'endgroup', (data) ->
        groups.pop()
      err.on 'data', (data) ->
        chai.expect(data).to.be.an 'error'
        chai.expect(data.message).to.equal 'No value'
        chai.expect(data.key).to.equal 'testmissingkey'
        chai.expect(groups).to.eql ['foo', 'bar']
        received = true
      err.on 'disconnect', ->
        chai.expect(received).to.equal true
        done()

      ins.beginGroup 'foo'
      ins.beginGroup 'bar'
      ins.send 'testmissingkey'
      ins.endGroup()
      ins.endGroup()
      ins.disconnect()

  describe 'with an existing key', ->
    it 'should send the value', (done) ->
      received = false
      out.on 'data', (data) ->
        chai.expect(data).to.equal 'baz'
        received = true
      out.on 'disconnect', ->
        chai.expect(received).to.equal true
        done()

      client.set 'newkey', 'baz', (err, reply) ->
        return done err if err
        created.push 'newkey'
        ins.send 'newkey'
        ins.disconnect()

  describe 'with multiple existing keys', ->
    it 'should send the values', (done) ->
      expected = [
        'baz'
        'bar'
      ]

      received = false
      out.on 'data', (data) ->
        chai.expect(data).to.equal expected.shift()
        return if expected.length
        done()

      client.mset ['newkey', 'baz', 'secondkey', 'bar'], (err) ->
        return done err if err
        created.push 'newkey'
        created.push 'secondkey'
        ins.send 'newkey'
        ins.send 'secondkey'
        ins.disconnect()
