noflo = require 'noflo'
redis = require 'redis'
url = require 'url'

class RedisComponent extends noflo.AsyncComponent
  constructor: (@inPortName='key') ->
    @redis = null
    @timeOut = null

    @inPorts[@inPortName].on 'connect', =>
      clearTimeout @timeOut if @timeOut
      do @connect

    @inPorts[@inPortName].on 'disconnect', =>
      @timeOut = setTimeout =>
        do @disconnect
      , 300

    @inPorts.url = new noflo.Port
    @inPorts.url.on 'data', (data) =>
      do @disconnect
      @redis = @createUrlClient data

    do @connect
    super @inPortName

  connect: ->
    return if @redis

    if process.env.REDISTOGO_URL
      @redis = @createUrlClient process.env.REDISTOGO_URL
    else
      @redis = redis.createClient()

    @redis.on 'error', (error) =>
      unless @outPorts.error.isAttached()
        throw error
        return
      @outPorts.error.send error
      @outPorts.error.disconnect()

  disconnect: ->
    return unless @redis
    @redis.end()
    @redis = null

  createUrlClient: (redisUrl) ->
    params = url.parse redisUrl
    redis = redis.createClient params.port, params.hostname
    redis.auth params.auth.split(':')[1] if params.auth
    redis

exports.RedisComponent = RedisComponent
