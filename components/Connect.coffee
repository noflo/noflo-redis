noflo = require 'noflo'
redis = require 'redis'

# @runtime noflo-nodejs

exports.getComponent = ->
  c = new noflo.Component
  c.inPorts.add 'url',
    datatype: 'string'
    description: 'Redis database URL to connect to'
  c.outPorts.add 'client',
    datatype: 'object'
  c.outPorts.add 'error',
    datatype: 'object'
  c.forwardBrackets =
    url: ['client', 'error']
  c.process (input, output) ->
    return unless input.hasData 'url'
    url = input.getData 'url'
    client = redis.createClient url
    onError = (err) ->
      client.quit()
      output.done err
      return
    client.once 'connect', ->
      client.removeListener 'error', onError
      output.sendDone
        client: client
      return
    client.once 'error', onError
