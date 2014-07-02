redis = require 'redis'
url = require 'url'

createUrlClient = (redisUrl) ->
  params = url.parse redisUrl
  r = redis.createClient params.port, params.hostname
  r.auth params.auth.split(':')[1] if params.auth
  r

module.exports = (instance, inPort) ->
  instance.redis = null
  instance.inPorts.add 'url',
    datatype: 'string'
    process: (event, data) ->
      return unless event is 'data'
      instance.disconnect()
      instance.redis = createUrlClient data

  instance.inPorts[inPort].on 'connect', ->
    do instance.connect

  instance.connect = ->
    return if instance.redis

    if process.env.REDISTOGO_URL
      instance.redis = createUrlClient process.env.REDISTOGO_URL
    else
      # Try connecting to local
      instance.redis = redis.createClient()

    instance.redis.on 'error', (e) ->
      instance.error e

  instance.disconnect = ->
    return unless instance.redis
    instance.redis.end()
    instance.redis = null

  instance.shutdown = ->
    instance.disconnect()
