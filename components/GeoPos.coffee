noflo = require 'noflo'

# @runtime noflo-nodejs

exports.getComponent = ->
  c = new noflo.Component
  c.description = 'Get the geographical position of member in a set'
  c.icon = 'map-marker'
  c.inPorts.add 'key',
    datatype: 'string'
  c.inPorts.add 'member',
    datatype: 'string'
  c.inPorts.add 'client',
    datatype: 'object'
    description: 'Redis client connection'
    control: true
    scoped: false
  c.outPorts.add 'latitude',
    datatype: 'number'
  c.outPorts.add 'longitude',
    datatype: 'number'
  c.outPorts.add 'error',
    datatype: 'object'

  c.forwardBrackets =
    member: ['latitude', 'longitude', 'error']

  c.process (input, output) ->
    return unless input.hasData 'client', 'key', 'member'
    [client, key, member] = input.getData 'client', 'key', 'member'
    client.geopos key, member, (err, reply) ->
      if err
        err.key = key
        err.member = member
        output.done err
        return
      unless reply?[0]?.length
        err = new Error 'No value'
        err.key = key
        err.member = member
        output.done err
        return
      output.sendDone
        latitude: parseFloat reply[0][0]
        longitude: parseFloat reply[0][1]
