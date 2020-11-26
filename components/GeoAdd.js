const noflo = require('noflo');

// @runtime noflo-nodejs

exports.getComponent = () => {
  const c = new noflo.Component();
  c.description = 'Add a member to a geopositioned set';
  c.icon = 'map-marker';
  c.inPorts.add('key',
    { datatype: 'string' });
  c.inPorts.add('member',
    { datatype: 'string' });
  c.inPorts.add('latitude',
    { datatype: 'number' });
  c.inPorts.add('longitude',
    { datatype: 'number' });
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
    if (!input.hasData('client', 'key')) { return; }
    if (!input.hasData('member', 'latitude', 'longitude')) { return; }
    const [client, key] = input.getData('client', 'key');
    const [member, lat, lon] = input.getData('member', 'latitude', 'longitude');

    client.geoadd(key, lat, lon, member, (err, reply) => {
      if (err) {
        output.done({
          ...err,
          key,
          member,
        });
        return;
      }
      output.sendDone({ out: reply });
    });
  });
};
