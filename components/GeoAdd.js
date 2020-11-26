/*
 * decaffeinate suggestions:
 * DS101: Remove unnecessary use of Array.from
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const noflo = require('noflo');

// @runtime noflo-nodejs

exports.getComponent = function() {
  const c = new noflo.Component;
  c.description = 'Add a member to a geopositioned set';
  c.icon = 'map-marker';
  c.inPorts.add('key',
    {datatype: 'string'});
  c.inPorts.add('member',
    {datatype: 'string'});
  c.inPorts.add('latitude',
    {datatype: 'number'});
  c.inPorts.add('longitude',
    {datatype: 'number'});
  c.inPorts.add('client', {
    datatype: 'object',
    description: 'Redis client connection',
    control: true,
    scoped: false
  }
  );
  c.outPorts.add('out',
    {datatype: 'string'});
  c.outPorts.add('error',
    {datatype: 'object'});

  c.forwardBrackets =
    {member: ['out', 'error']};

  return c.process(function(input, output) {
    if (!input.hasData('client', 'key')) { return; }
    if (!input.hasData('member', 'latitude', 'longitude')) { return; }
    const [client, key] = Array.from(input.getData('client', 'key'));
    const [member, lat, lon] = Array.from(input.getData('member', 'latitude', 'longitude'));

    return client.geoadd(key, lat, lon, member, function(err, reply) {
      if (err) {
        console.log(err);
        err.key = key;
        err.member = member;
        output.done(err);
        return;
      }
      return output.sendDone({
        out: reply});
    });
  });
};
