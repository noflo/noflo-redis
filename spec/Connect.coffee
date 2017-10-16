noflo = require 'noflo'

unless noflo.isBrowser()
  chai = require 'chai'
  path = require 'path'
  baseDir = path.resolve __dirname, '../'
else
  baseDir = 'noflo-redis'

describe 'Connect component', ->
  c = null
  ins = null
  out = null
  err = null
  client = null
  before (done) ->
    @timeout 4000
    loader = new noflo.ComponentLoader baseDir
    loader.load 'redis/Connect', (err, instance) ->
      return done err if err
      c = instance
      ins = noflo.internalSocket.createSocket()
      c.inPorts.url.attach ins
      done()
  after (done) ->
    done()
  beforeEach ->
    out = noflo.internalSocket.createSocket()
    c.outPorts.client.attach out
    err = noflo.internalSocket.createSocket()
    c.outPorts.error.attach err
  afterEach (done) ->
    c.outPorts.client.detach out
    out = null
    c.outPorts.error.detach err
    err = null
    return done() unless client
    client.quit (err) ->
      return done err if err
      client = null
      done()
  describe 'with an empty URL', ->
    it 'should connect to default Redis', (done) ->
      err.on 'data', done
      out.on 'data', (redis) ->
        client = redis
        chai.expect(client.psubscribe).to.be.a 'function'
        done()
      ins.send null
  describe 'with a correctly-defined URL', ->
    it 'should connect to defined Redis', (done) ->
      err.on 'data', done
      out.on 'data', (redis) ->
        client = redis
        chai.expect(client.psubscribe).to.be.a 'function'
        done()
      ins.send 'redis://localhost:6379'
  describe 'with an incorrect URL', ->
    it 'should send an error', (done) ->
      err.on 'data', (err) ->
        chai.expect(err).to.be.an 'error'
        done()
      out.on 'data', (redis) ->
        done new Error 'Received connection while should not have'
      ins.send 'redis://localhost:6380'
