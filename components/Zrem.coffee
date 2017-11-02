noflo = require 'noflo'

# @runtime noflo-nodejs

exports.getComponent = ->
  c = new noflo.Component
  c.description = 'Remove a member from a sorted set'
  c.icon = 'trash'
  c.inPorts.add 'key',
    datatype: 'string'
  c.inPorts.add 'member',
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
    member: ['out', 'error']

  c.process (input, output) ->
    return unless input.hasData 'client', 'key', 'member'
    [client, key, member] = input.getData 'client', 'key', 'member'
    client.zrem key, member, (err, reply) ->
      if err
        err.key = key
        err.member = member
        output.done err
        return
      output.sendDone
        out:
          key: key
          member: member
    return
