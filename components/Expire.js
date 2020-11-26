const noflo = require('noflo');

// @runtime noflo-nodejs

exports.getComponent = () => {
  const c = new noflo.Component();
  c.description = 'Set expiry time for a Redis key';
  c.icon = 'hourglass';
  c.inPorts.add('key',
    { datatype: 'string' });
  c.inPorts.add('expire', {
    datatype: 'int',
    description: 'Expiry in seconds',
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

  c.forwardBrackets = { key: ['out', 'error'] };

  return c.process((input, output) => {
    if (!input.hasData('client', 'key', 'expire')) { return; }
    const [client, key, expire] = Array.from(input.getData('client', 'key', 'expire'));
    client.expire(key, expire, (err, reply) => {
      if (err) {
        output.done({
          ...err,
          key,
        });
        return;
      }
      if (!reply) {
        const error = new Error('No value');
        error.key = key;
        output.done(error);
        return;
      }
      output.sendDone({ out: key });
    });
  });
};
