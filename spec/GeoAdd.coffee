noflo = require 'noflo'
redis = require 'redis'

unless noflo.isBrowser()
  chai = require 'chai'
  path = require 'path'
  baseDir = path.resolve __dirname, '../'
else
  baseDir = 'noflo-redis'

describe 'GeoAdd component', ->
  c = null
  key = null
  member = null
  lat = null
  lon = null
  out = null
  err = null
  created = []
  client = null
  before (done) ->
    @timeout 4000
    loader = new noflo.ComponentLoader baseDir
    loader.load 'redis/GeoAdd', (err, instance) ->
      return done err if err
      c = instance
      key = noflo.internalSocket.createSocket()
      c.inPorts.key.attach key
      member = noflo.internalSocket.createSocket()
      c.inPorts.member.attach member
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
  afterEach (done) ->
    c.outPorts.out.detach out
    out = null
    c.outPorts.error.detach err
    err = null
    remove = ->
      return done() unless created.length
      createdMember = created.shift()
      client.zrem createdMember.key, createdMember.member, (err) ->
        return done err if err
        do remove
    do remove

  describe 'adding a position', ->
    it 'should persist the member', (done) ->
      err.on 'data', done
      out.on 'data', (data) ->
        chai.expect(data).to.equal 1
        created.push
          key: 'testset'
          member: 'EFHF'
        client.geopos 'testset', 'EFHF', (err, reply) ->
          return done err if err
          chai.expect(parseInt(reply[0][0])).to.equal 60
          chai.expect(parseInt(reply[0][1])).to.equal 25
          done()
      key.send 'testset'
      member.send 'EFHF'
      lat.send 60.254558
      lon.send 25.042828
