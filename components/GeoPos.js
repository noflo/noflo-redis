const noflo = require('noflo');

// @runtime noflo-nodejs

exports.getComponent = () => {
  const c = new noflo.Component();
  c.description = 'Get the geographical position of member in a set';
  c.icon = 'map-marker';
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
  c.outPorts.add('latitude',
    { datatype: 'number' });
  c.outPorts.add('longitude',
    { datatype: 'number' });
  c.outPorts.add('error',
    { datatype: 'object' });

  c.forwardBrackets = { member: ['latitude', 'longitude', 'error'] };

  return c.process((input, output) => {
    if (!input.hasData('client', 'key', 'member')) { return; }
    const [client, key, member] = Array.from(input.getData('client', 'key', 'member'));
    client.geopos(key, member, (err, reply) => {
      if (err) {
        output.done({
          ...err,
          key,
          member,
        });
        return;
      }
      if (!reply || !reply.length) {
        const error = new Error('No value');
        error.key = key;
        error.member = member;
        output.done(error);
        return;
      }
      output.sendDone({
        latitude: parseFloat(reply[0][0]),
        longitude: parseFloat(reply[0][1]),
      });
    });
  });
};
