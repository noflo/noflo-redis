noflo = require 'noflo'
RedisPattern = require '../lib/RedisPattern.coffee'

# @runtime noflo-nodejs
#
exports.getComponent = ->
  c = new noflo.Component
  c.description = 'Set a Redis entry'
  c.inPorts.add 'key',
    datatype: 'string'
  c.inPorts.add 'value',
    datatype: 'string'
  c.outPorts.add 'out',
    datatype: 'string'
  c.outPorts.add 'error',
    datatype: 'object'

  RedisPattern c, 'key'
  noflo.helpers.WirePattern c,
    in: ['key', 'value']
    out: 'out'
    async: true
    forwardGroups: true
  , (data, groups, out, callback) ->
    unless c.redis
      err = new Error 'No Redis connection available'
      err.key = key
      callback err
      return

    if typeof data.value is 'object'
      data.value = JSON.stringify data.value

    c.redis.set data.key, data.value, (err, reply) ->
      if err
        err.key = data.key
        return callback err
      unless reply
        err = new Error 'No value'
        err.key = data.key
        return callback err
      out.beginGroup data.key
      out.send reply
      out.endGroup()
      do callback

  c
