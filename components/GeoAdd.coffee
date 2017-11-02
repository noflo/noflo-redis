noflo = require 'noflo'

# @runtime noflo-nodejs

exports.getComponent = ->
  c = new noflo.Component
  c.description = 'Add a member to a geopositioned set'
  c.icon = 'map-marker'
  c.inPorts.add 'key',
    datatype: 'string'
  c.inPorts.add 'member',
    datatype: 'string'
  c.inPorts.add 'latitude',
    datatype: 'number'
  c.inPorts.add 'longitude',
    datatype: 'number'
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
    return unless input.hasData 'client', 'key'
    return unless input.hasData 'member', 'latitude', 'longitude'
    [client, key] = input.getData 'client', 'key'
    [member, lat, lon] = input.getData 'member', 'latitude', 'longitude'

    client.geoadd key, lat, lon, member, (err, reply) ->
      if err
        console.log err
        err.key = key
        err.member = member
        output.done err
        return
      unless reply
        err = new Error 'No value'
        err.key = key
        err.member = member
        output.done err
        return
      output.sendDone
        out: reply
