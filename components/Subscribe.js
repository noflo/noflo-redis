const noflo = require('noflo');

// @runtime noflo-nodejs

exports.getComponent = () => {
  const c = new noflo.Component();
  c.icon = 'stack-overflow';
  c.description = 'Receive messages from a specified channel';
  c.inPorts.add('channel', {
    datatype: 'string',
    description: 'Channel to subscribe to',
  });
  c.inPorts.add('client', {
    datatype: 'object',
    description: 'Redis client connection',
    control: true,
    scoped: false,
  });
  c.outPorts.add('out',
    { datatype: 'string' });
  c.outPorts.add('error',
    { datatype: 'object' });
  c.subscription = null;
  function unsubscribe() {
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
    c.subscription = null;
  }
  c.tearDown = (callback) => {
    unsubscribe();
    callback();
  };
  return c.process((input, output, context) => {
    if (!input.hasData('client', 'channel')) { return; }
    const [client, channel] = input.getData('client', 'channel');

    // Remove previous subscription, if any
    unsubscribe();

    c.subscription = {
      ctx: context,
      client,
    };

    if (channel.indexOf('*') !== -1) {
      // Pattern subscription
      c.subscription.pchannel = channel;
      client.psubscribe(channel, (err) => {
        if (err) {
          output.done({
            ...err,
            channel,
          });
          return;
        }
        c.subscription.listener = (patt, chan, msg) => output.send({ out: msg });
        client.on('pmessage', c.subscription.listener);
        c.emit('psubscribe', channel);
      });
      return;
    }
    // Exact channel subscription
    c.subscription.channel = channel;
    client.subscribe(channel, (err) => {
      if (err) {
        output.done({
          ...err,
          channel,
        });
        return;
      }
      c.subscription.listener = (chan, msg) => output.send({ out: msg });
      client.on('message', c.subscription.listener);
      c.emit('subscribe', channel);
    });
  });
};
