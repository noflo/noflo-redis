noflo = require 'noflo'
{RedisComponent} = require '../lib/RedisComponent.coffee'

class Get extends RedisComponent
  constructor: ->
    @inPorts =
      key: new noflo.Port
    @outPorts =
      out: new noflo.Port
      error: new noflo.Port

    super()

  doAsync: (key, callback) ->
    unless @redis
      callback new Error 'No Redis connection available'
      return

    @outPorts.out.connect()
    @redis.get key, (err, reply) =>
      if err
        @outPorts.out.disconnect()
        return callback err
      unless reply
        @outPorts.out.disconnect()
        return callback new Error 'No value'
      @outPorts.out.beginGroup key
      @outPorts.out.send reply
      @outPorts.out.endGroup()
      callback()

exports.getComponent = -> new Get
