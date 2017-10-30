noflo = require 'noflo'
redis = require 'redis'

unless noflo.isBrowser()
  chai = require 'chai'
  path = require 'path'
  baseDir = path.resolve __dirname, '../'
else
  baseDir = 'noflo-redis'

describe 'GeoRadius component', ->
  c = null
  key = null
  radius = null
  unit = null
  lat = null
  lon = null
  out = null
  err = null
  client = null
  before (done) ->
    @timeout 4000
    loader = new noflo.ComponentLoader baseDir
    loader.load 'redis/GeoRadius', (err, instance) ->
      return done err if err
      c = instance
      key = noflo.internalSocket.createSocket()
      c.inPorts.key.attach key
      radius = noflo.internalSocket.createSocket()
      c.inPorts.radius.attach radius
      unit = noflo.internalSocket.createSocket()
      c.inPorts.unit.attach unit
      lat = noflo.internalSocket.createSocket()
      c.inPorts.latitude.attach lat
      lon = noflo.internalSocket.createSocket()
      c.inPorts.longitude.attach lon
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

  describe 'getting members inside a radius', ->
    before (done) ->
      client.geoadd 'testset', 60.254558, 25.042828, 'EFHF', (err) ->
        return done err if err
        client.geoadd 'testset', 60.317222, 24.963333, 'EFHK', done
    after (done) ->
      client.zrem 'testset', 'EFHF', (err) ->
        return done err if err
        client.zrem 'testset', 'EFHK', done
    it 'should return one member inside small radius', (done) ->
      err.on 'data', done
      out.on 'data', (data) ->
        chai.expect(data).to.eql [
          'EFHF'
        ]
        done()
      key.send 'testset'
      lat.send 60.254558
      lon.send 25.042828
      unit.send 'km'
      radius.send 6
    it 'should return two members inside larger radius', (done) ->
      err.on 'data', done
      out.on 'data', (data) ->
        chai.expect(data).to.eql [
          'EFHF'
          'EFHK'
        ]
        done()
      key.send 'testset'
      lat.send 60.254558
      lon.send 25.042828
      unit.send 'km'
      radius.send 11
