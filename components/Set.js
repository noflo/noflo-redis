const noflo = require('noflo');

// @runtime noflo-nodejs

exports.getComponent = () => {
  const c = new noflo.Component();
  c.description = 'Set a Redis entry';
  c.inPorts.add('key',
    { datatype: 'string' });
  c.inPorts.add('value',
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

  c.forwardBrackets = { value: ['out', 'error'] };

  return c.process((input, output) => {
    if (!input.hasData('client', 'key', 'value')) { return; }
    const [client, key, value] = input.getData('client', 'key', 'value');

    let stringValue = value;
    if (typeof value === 'object') {
      stringValue = JSON.stringify(value);
    }

    client.set(key, stringValue, (err, reply) => {
      if (err) {
        output.done({
          ...err,
          key,
        });
        return;
      }
      output.sendDone({ out: reply });
    });
  });
};
