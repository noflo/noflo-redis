noflo = require 'noflo'

# @runtime noflo-nodejs

exports.getComponent = ->
  c = new noflo.Component
  c.description = 'Set a Redis entry'
  c.inPorts.add 'key',
    datatype: 'string'
  c.inPorts.add 'value',
    datatype: 'string'
  c.inPorts.add 'client',
    datatype: 'object'
    description: 'Redis client connection'
    control: true
    scoped: false
  c.outPorts.add 'out',
    datatype: 'string'
  c.outPorts.add 'error',
    datatype: 'object'

  c.forwardBrackets =
    value: ['out', 'error']

  c.process (input, output) ->
    return unless input.hasData 'client', 'key', 'value'
    [client, key, value] = input.getData 'client', 'key', 'value'

    if typeof value is 'object'
      value = JSON.stringify value

    client.set key, value, (err, reply) ->
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
