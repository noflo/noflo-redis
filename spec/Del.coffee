noflo = require 'noflo'
redis = require 'redis'

unless noflo.isBrowser()
  chai = require 'chai'
  path = require 'path'
  baseDir = path.resolve __dirname, '../'
else
  baseDir = 'noflo-redis'

describe 'Del component', ->
  c = null
  ins = null
  out = null
  err = null
  created = []
  client = null
  before (done) ->
    @timeout 4000
    loader = new noflo.ComponentLoader baseDir
    loader.load 'redis/Del', (err, instance) ->
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
    client.del created, ->
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

  describe 'with a missing key', ->
    it 'should send the key out', (done) ->
      expected = [
        '< foo'
        '< bar'
        'testmissingkey'
        '>'
        '>'
      ]
      received = []
      out.on 'begingroup', (data) ->
        received.push "< #{data}"
      out.on 'data', (data) ->
        received.push data
      out.on 'endgroup', (data) ->
        received.push '>'
        return unless received.length is expected.length
        chai.expect(received).to.eql expected
        done()

      ins.beginGroup 'foo'
      ins.beginGroup 'bar'
      ins.send 'testmissingkey'
      ins.endGroup()
      ins.endGroup()
      ins.disconnect()

  describe 'with an existing key', ->
    it 'should send the key out', (done) ->
      groups = []
      received = false
      out.on 'data', (data) ->
        chai.expect(data).to.equal 'newkey'
        received = true
      out.on 'disconnect', ->
        chai.expect(received).to.equal true
        # Check that key was actually removed
        client.get 'newkey', (err, val) ->
          chai.expect(val).to.be.a 'null'
          done()

      client.set 'newkey', 'baz', (err, reply) ->
        return done err if err
        ins.send 'newkey'
        ins.disconnect()
