noflo = require 'noflo'
redis = require 'redis'

unless noflo.isBrowser()
  chai = require 'chai'
  path = require 'path'
  baseDir = path.resolve __dirname, '../'
else
  baseDir = 'noflo-redis'

describe 'Zrem component', ->
  c = null
  key = null
  member = null
  out = null
  err = null
  client = null
  before (done) ->
    @timeout 4000
    loader = new noflo.ComponentLoader baseDir
    loader.load 'redis/Zrem', (err, keytance) ->
      return done err if err
      c = keytance
      key = noflo.internalSocket.createSocket()
      c.inPorts.key.attach key
      member = noflo.internalSocket.createSocket()
      c.inPorts.member.attach member
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
  afterEach ->
    c.outPorts.out.detach out
    out = null
    c.outPorts.error.detach err
    err = null

  describe 'with a missing key', ->
    it 'should send the key out', (done) ->
      out.on 'data', (data) ->
        chai.expect(data).to.eql
          key: 'testmissingkey'
          member: 'foo'
        done()

      key.send 'testmissingkey'
      member.send 'foo'
      key.disconnect()

  describe 'with an existing key', ->
    it 'should send the key out', (done) ->
      out.on 'data', (data) ->
        chai.expect(data).to.eql
          key: 'newkey'
          member: 'baz'
        # Check that member was actually removed
        client.zrange 'newkey', 0, 1, (err, val) ->
          chai.expect(val).to.be.eql []
          done()

      client.zadd 'newkey', 1, 'baz', (err, reply) ->
        return done err if err
        key.send 'newkey'
        member.send 'baz'
