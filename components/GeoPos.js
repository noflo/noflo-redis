/*
 * decaffeinate suggestions:
 * DS101: Remove unnecessary use of Array.from
 * DS102: Remove unnecessary code created because of implicit returns
 * DS103: Rewrite code to no longer use __guard__, or convert again using --optional-chaining
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const noflo = require('noflo');

// @runtime noflo-nodejs

exports.getComponent = function() {
  const c = new noflo.Component;
  c.description = 'Get the geographical position of member in a set';
  c.icon = 'map-marker';
  c.inPorts.add('key',
    {datatype: 'string'});
  c.inPorts.add('member',
    {datatype: 'string'});
  c.inPorts.add('client', {
    datatype: 'object',
    description: 'Redis client connection',
    control: true,
    scoped: false
  }
  );
  c.outPorts.add('latitude',
    {datatype: 'number'});
  c.outPorts.add('longitude',
    {datatype: 'number'});
  c.outPorts.add('error',
    {datatype: 'object'});

  c.forwardBrackets =
    {member: ['latitude', 'longitude', 'error']};

  return c.process(function(input, output) {
    if (!input.hasData('client', 'key', 'member')) { return; }
    const [client, key, member] = Array.from(input.getData('client', 'key', 'member'));
    return client.geopos(key, member, function(err, reply) {
      if (err) {
        err.key = key;
        err.member = member;
        output.done(err);
        return;
      }
      if (!__guard__(reply != null ? reply[0] : undefined, x => x.length)) {
        err = new Error('No value');
        err.key = key;
        err.member = member;
        output.done(err);
        return;
      }
      return output.sendDone({
        latitude: parseFloat(reply[0][0]),
        longitude: parseFloat(reply[0][1])});
  });});
};

function __guard__(value, transform) {
  return (typeof value !== 'undefined' && value !== null) ? transform(value) : undefined;
}