noflo = require 'noflo'
redis = require 'redis'
url = require 'url'

class RedisComponent extends noflo.AsyncComponent
  constructor: (@inPortName='key') ->
    @redis = null

    if process.env.REDISTOGO_URL
      @createClient process.env.REDISTOGO_URL
    else
      @redis = redis.createClient()

      @inPorts.url = new noflo.Port
      @inPorts.url.on 'data', (data) =>
        @createClient data

    @inPorts[@inPortName].on 'disconnect', =>
      setTimeout =>
        @redis.end()
      , 300

    super @inPortName

  createClient: (redisUrl) ->
    params = url.parse redisUrl
    @redis = redis.createClient params.port, params.hostname
    @redis.auth params.auth.split(':')[1] if params.auth

exports.RedisComponent = RedisComponent
