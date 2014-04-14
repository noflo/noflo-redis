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
      err = new Error 'No Redis connection available'
      err.key = key
      callback err
      return

    @outPorts.out.connect()
    @redis.get key, (err, reply) =>
      if err
        @outPorts.out.disconnect()
        err.key = key
        return callback err
      unless reply
        @outPorts.out.disconnect()
        err = new Error 'No value'
        err.key = key
        return callback err
      @outPorts.out.beginGroup key
      @outPorts.out.send reply
      @outPorts.out.endGroup()
      callback()

exports.getComponent = -> new Get
