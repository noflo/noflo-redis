const noflo = require('noflo');

// @runtime noflo-nodejs

exports.getComponent = () => {
  const c = new noflo.Component();
  c.description = 'Get a list of members inside a radius';
  c.icon = 'map-o';
  c.inPorts.add('key',
    { datatype: 'string' });
  c.inPorts.add('latitude',
    { datatype: 'number' });
  c.inPorts.add('longitude',
    { datatype: 'number' });
  c.inPorts.add('radius',
    { datatype: 'number' });
  c.inPorts.add('unit', {
    datatype: 'string',
    default: 'm',
    control: true,
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
    if (!input.hasData('client', 'key')) { return; }
    if (!input.hasData('radius', 'latitude', 'longitude')) { return; }
    if (input.attached('unit').length && !input.hasData('unit')) { return; }
    const [client, key] = input.getData('client', 'key');
    const [radius, lat, lon] = input.getData('radius', 'latitude', 'longitude');
    let unit = 'm';
    if (input.hasData('unit')) {
      unit = input.getData('unit');
    }
    client.georadius(key, lat, lon, radius, unit, (err, reply) => {
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
