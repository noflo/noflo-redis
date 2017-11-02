noflo = require 'noflo'

# @runtime noflo-nodejs

exports.getComponent = ->
  c = new noflo.Component
  c.icon = 'stack-overflow'
  c.description = 'Receive messages from a specified channel'
  c.inPorts.add 'channel',
    datatype: 'string'
    description: 'Channel to subscribe to'
  c.inPorts.add 'client',
    datatype: 'object'
    description: 'Redis client connection'
    control: true
    scoped: false
  c.outPorts.add 'out',
    datatype: 'string'
  c.outPorts.add 'error',
    datatype: 'object'
  c.subscription = null
  unsubscribe = ->
    return unless c.subscription
    if c.subscription.channel and c.subscription.client
      if c.subscription.listener
        c.subscription.client.removeListener 'message', c.subscription.listener
      c.subscription.client.unsubscribe c.subscription.channel
    if c.subscription.pchannel and c.subscription.client
      if c.subscription.listener
        c.subscription.client.removeListener 'pmessage', c.subscription.listener
      c.subscription.client.punsubscribe c.subscription.pchannel
    if c.subscription.ctx
      c.subscription.ctx.deactivate()
    c.subscription = null
  c.tearDown = (callback) ->
    do unsubscribe
    do callback
  c.process (input, output, context) ->
    return unless input.hasData 'client', 'channel'
    [client, channel] = input.getData 'client', 'channel'

    # Remove previous subscription, if any
    do unsubscribe

    c.subscription =
      ctx: context
      client: client

    if channel.indexOf('*') isnt -1
      # Pattern subscription
      c.subscription.pchannel = channel
      client.psubscribe channel, (err) ->
        if err
          err.channel = channel
          output.done err
          return
        c.subscription.listener = (patt, chan, msg) ->
          output.send
            out: msg
        client.on 'pmessage', c.subscription.listener
        c.emit 'psubscribe', channel
      return
    # Exact channel subscription
    c.subscription.channel = channel
    client.subscribe channel, (err) ->
      if err
        err.channel = channel
        output.done err
        return
      c.subscription.listener = (chan, msg) ->
        output.send
          out: msg
      client.on 'message', c.subscription.listener
      c.emit 'subscribe', channel
