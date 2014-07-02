noflo = require 'noflo'
RedisPattern = require '../lib/RedisPattern.coffee'

# @runtime noflo-nodejs

exports.getComponent = ->
  c = new noflo.Component
  c.description = 'Get a Redis entry by key'
  c.inPorts.add 'key',
    datatype: 'string'
  c.outPorts.add 'out',
    datatype: 'string'
  c.outPorts.add 'error',
    datatype: 'object'

  RedisPattern c, 'key'
  noflo.helpers.WirePattern c,
    in: 'key'
    out: 'out'
    async: true
    forwardGroups: true
  , (key, groups, out, callback) ->
    unless c.redis
      err = new Error 'No Redis connection available'
      err.key = key
      callback err
      return

    c.redis.get key, (err, reply) ->
      if err
        err.key = key
        return callback err
      unless reply
        err = new Error 'No value'
        err.key = key
        return callback err
      out.beginGroup key
      out.send reply
      out.endGroup()
      do callback

  noflo.helpers.MultiError c

  c
