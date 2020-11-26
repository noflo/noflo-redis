const noflo = require('noflo');

// @runtime noflo-nodejs

exports.getComponent = () => {
  const c = new noflo.Component();
  c.icon = 'paper-plane';
  c.description = 'Publish a message into a specified channel';
  c.inPorts.add('channel', {
    datatype: 'string',
    description: 'Channel to publish to',
  });
  c.inPorts.add('message', {
    datatype: 'string',
    description: 'Message to publish',
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
  c.forwardBrackets = { value: ['out', 'error'] };

  return c.process((input, output) => {
    if (!input.hasData('client', 'channel', 'message')) { return; }
    const [client, channel, message] = input.getData('client', 'channel', 'message');
    client.publish(channel, message, (err, reply) => {
      if (err) {
        output.done({
          ...err,
          channel,
        });
        return;
      }
      output.sendDone({ out: reply });
    });
  });
};
