noflo = require 'noflo'

# @runtime noflo-nodejs

exports.getComponent = ->
  c = new noflo.Component
  c.description = 'Get a Redis entry by key'
  c.inPorts.add 'key',
    datatype: 'string'
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
    return unless input.hasData 'client', 'key'
    [client, key] = input.getData 'client', 'key'
    client.get key, (err, reply) ->
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
        out: reply
