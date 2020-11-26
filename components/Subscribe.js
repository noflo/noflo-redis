/*
 * decaffeinate suggestions:
 * DS101: Remove unnecessary use of Array.from
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const noflo = require('noflo');

// @runtime noflo-nodejs

exports.getComponent = function() {
  const c = new noflo.Component;
  c.icon = 'stack-overflow';
  c.description = 'Receive messages from a specified channel';
  c.inPorts.add('channel', {
    datatype: 'string',
    description: 'Channel to subscribe to'
  }
  );
  c.inPorts.add('client', {
    datatype: 'object',
    description: 'Redis client connection',
    control: true,
    scoped: false
  }
  );
  c.outPorts.add('out',
    {datatype: 'string'});
  c.outPorts.add('error',
    {datatype: 'object'});
  c.subscription = null;
  const unsubscribe = function() {
    if (!c.subscription) { return; }
    if (c.subscription.channel && c.subscription.client) {
      if (c.subscription.listener) {
        c.subscription.client.removeListener('message', c.subscription.listener);
      }
      c.subscription.client.unsubscribe(c.subscription.channel);
    }
    if (c.subscription.pchannel && c.subscription.client) {
      if (c.subscription.listener) {
        c.subscription.client.removeListener('pmessage', c.subscription.listener);
      }
      c.subscription.client.punsubscribe(c.subscription.pchannel);
    }
    if (c.subscription.ctx) {
      c.subscription.ctx.deactivate();
    }
    return c.subscription = null;
  };
  c.tearDown = function(callback) {
    unsubscribe();
    return callback();
  };
  return c.process(function(input, output, context) {
    if (!input.hasData('client', 'channel')) { return; }
    const [client, channel] = Array.from(input.getData('client', 'channel'));

    // Remove previous subscription, if any
    unsubscribe();

    c.subscription = {
      ctx: context,
      client
    };

    if (channel.indexOf('*') !== -1) {
      // Pattern subscription
      c.subscription.pchannel = channel;
      client.psubscribe(channel, function(err) {
        if (err) {
          err.channel = channel;
          output.done(err);
          return;
        }
        c.subscription.listener = (patt, chan, msg) => output.send({
          out: msg});
        client.on('pmessage', c.subscription.listener);
        return c.emit('psubscribe', channel);
      });
      return;
    }
    // Exact channel subscription
    c.subscription.channel = channel;
    return client.subscribe(channel, function(err) {
      if (err) {
        err.channel = channel;
        output.done(err);
        return;
      }
      c.subscription.listener = (chan, msg) => output.send({
        out: msg});
      client.on('message', c.subscription.listener);
      return c.emit('subscribe', channel);
    });
  });
};
