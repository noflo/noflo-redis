noflo = require 'noflo'

# @runtime noflo-nodejs

exports.getComponent = ->
  c = new noflo.Component
  c.description = 'Set a Redis entry'
  c.inPorts.add 'key',
    datatype: 'string'
  c.inPorts.add 'latitude',
    datatype: 'number'
  c.inPorts.add 'longitude',
    datatype: 'number'
  c.inPorts.add 'radius',
    datatype: 'number'
  c.inPorts.add 'unit',
    datatype: 'string'
    default: 'm'
    control: true
  c.inPorts.add 'client',
    datatype: 'object'
    description: 'Redis client connection'
    control: true
  c.outPorts.add 'out',
    datatype: 'string'
  c.outPorts.add 'error',
    datatype: 'object'

  c.forwardBrackets =
    value: ['out', 'error']

  c.process (input, output) ->
    return unless input.hasData 'client', 'key'
    return unless input.hasData 'radius', 'latitude', 'longitude'
    return if input.attached('unit').length and not input.hasData 'unit'
    [client, key] = input.getData 'client', 'key'
    [radius, lat, lon] = input.getData 'radius', 'latitude', 'longitude'
    unit = 'm'
    if input.hasData 'unit'
      unit = input.getData 'unit'
    client.georadius key, lat, lon, radius, unit, (err, reply) ->
      if err
        console.log err
        err.key = key
        output.done err
        return
      output.sendDone
        out: reply
