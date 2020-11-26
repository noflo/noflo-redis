const noflo = require('noflo');

// @runtime noflo-nodejs

exports.getComponent = () => {
  const c = new noflo.Component();
  c.description = 'Remove a member from a sorted set';
  c.icon = 'trash';
  c.inPorts.add('key',
    { datatype: 'string' });
  c.inPorts.add('member',
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

  c.forwardBrackets = { member: ['out', 'error'] };

  return c.process((input, output) => {
    if (!input.hasData('client', 'key', 'member')) { return; }
    const [client, key, member] = input.getData('client', 'key', 'member');
    client.zrem(key, member, (err) => {
      if (err) {
        output.done({
          ...err,
          key,
          member,
        });
        return;
      }
      output.sendDone({
        out: {
          key,
          member,
        },
      });
    });
  });
};
