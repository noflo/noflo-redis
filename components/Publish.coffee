noflo = require 'noflo'

# @runtime noflo-nodejs

exports.getComponent = ->
  c = new noflo.Component
  c.icon = 'paper-plane'
  c.description = 'Publish a message into a specified channel'
  c.inPorts.add 'channel',
    datatype: 'string'
    description: 'Channel to publish to'
  c.inPorts.add 'message',
    datatype: 'string'
    description: 'Message to publish'
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
    return unless input.hasData 'client', 'channel', 'message'
    [client, channel, message] = input.getData 'client', 'channel', 'message'
    client.publish channel, message, (err, reply) ->
      if err
        err.channel = channel
        output.done err
        return
      output.sendDone
        out: value
