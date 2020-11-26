const noflo = require('noflo');

// @runtime noflo-nodejs

exports.getComponent = () => {
  const c = new noflo.Component();
  c.description = 'Get a Redis entry by key';
  c.inPorts.add('key',
    { datatype: 'string' });
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
    if (!input.hasData('client', 'key')) { return; }
    const [client, key] = input.getData('client', 'key');
    client.get(key, (err, reply) => {
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
      output.sendDone({ out: reply });
    });
  });
};
