const noflo = require('noflo');

// @runtime noflo-nodejs

exports.getComponent = () => {
  const c = new noflo.Component();
  c.description = 'Remove a Redis entry by key';
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
    client.del(key, (err) => {
      if (err) {
        output.done({
          ...err,
          key,
        });
        return;
      }
      output.sendDone({ out: key });
    });
  });
};
