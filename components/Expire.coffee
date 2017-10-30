noflo = require 'noflo'

# @runtime noflo-nodejs

exports.getComponent = ->
  c = new noflo.Component
  c.description = 'Set expiry time for a Redis key'
  c.icon = 'hourglass'
  c.inPorts.add 'key',
    datatype: 'string'
  c.inPorts.add 'expire',
    datatype: 'int'
    description: 'Expiry in seconds'
  c.inPorts.add 'client',
    datatype: 'object'
    description: 'Redis client connection'
    control: true
  c.outPorts.add 'out',
    datatype: 'string'
  c.outPorts.add 'error',
    datatype: 'object'

  c.forwardBrackets =
    key: ['out', 'error']

  c.process (input, output) ->
    return unless input.hasData 'client', 'key', 'expire'
    [client, key, expire] = input.getData 'client', 'key', 'expire'
    client.expire key, expire, (err, reply) ->
      if err
        err.key = key
        output.done err
        return
      unless reply
        err = new Error 'No value'
        err.key = key
        output.done err
        return
      output.sendDone
        out: key
