noflo = require 'noflo'
redis = require 'redis'

unless noflo.isBrowser()
  chai = require 'chai'
  path = require 'path'
  baseDir = path.resolve __dirname, '../'
else
  baseDir = 'noflo-redis'

describe 'Set component', ->
  c = null
  key = null
  val = null
  out = null
  err = null
  created = []
  client = null
  before (done) ->
    @timeout 4000
    loader = new noflo.ComponentLoader baseDir
    loader.load 'redis/Set', (err, instance) ->
      return done err if err
      c = instance
      key = noflo.internalSocket.createSocket()
      c.inPorts.key.attach key
      val = noflo.internalSocket.createSocket()
      c.inPorts.value.attach val
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
  afterEach (done) ->
    c.outPorts.out.detach out
    out = null
    c.outPorts.error.detach err
    err = null
    remove = ->
      return done() unless created.length
      createdKey = created.shift()
      client.del createdKey, (err) ->
        return done err if err
        do remove
    do remove

  describe 'setting a key', ->
    it 'should persist the key', (done) ->
      out.on 'data', (data) ->
        chai.expect(data).to.equal 'OK'
        client.get 'testset', (err, reply) ->
          return done err if err
          chai.expect(reply).to.equal 'foo'
          created.push 'testset'
          done()
      key.send 'testset'
      val.send 'foo'
      val.disconnect()

  describe 'setting multiple keys', ->
    it 'should persist the keys', (done) ->
      expected =
        testfirst: 'foo'
        testsecond: 'bar'
      expectedKeys = Object.keys(expected)
      receivedKeys = []

      out.on 'data', (data) ->
        chai.expect(data).to.equal 'OK'
        expectedKey = expectedKeys.shift()
        expectedVal = expected[expectedKey]
        client.get expectedKey, (err, reply) ->
          return done err if err
          chai.expect(reply).to.equal expectedVal
          created.push expectedKey
          receivedKeys.push expectedKey
          done() if receivedKeys.length is Object.keys(expected).length

      for keyName, valContent of expected
        key.send keyName
        val.send valContent
      val.disconnect()

  describe 'setting a key with object value', ->
    it 'should persist the key', (done) ->
      out.on 'data', (data) ->
        chai.expect(data).to.equal 'OK'
        client.get 'testset', (err, reply) ->
          return done err if err
          obj = JSON.parse reply
          chai.expect(obj.id).to.equal 'bergie'
          chai.expect(obj.displayName).to.equal 'Henri Bergius'
          created.push 'testset'
          done()
      key.send 'testset'
      val.send
        id: 'bergie'
        displayName: 'Henri Bergius'
      val.disconnect()
