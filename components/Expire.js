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
  c.description = 'Set expiry time for a Redis key';
  c.icon = 'hourglass';
  c.inPorts.add('key',
    {datatype: 'string'});
  c.inPorts.add('expire', {
    datatype: 'int',
    description: 'Expiry in seconds'
  }
  );
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
    {key: ['out', 'error']};

  return c.process(function(input, output) {
    if (!input.hasData('client', 'key', 'expire')) { return; }
    const [client, key, expire] = Array.from(input.getData('client', 'key', 'expire'));
    return client.expire(key, expire, function(err, reply) {
      if (err) {
        err.key = key;
        output.done(err);
        return;
      }
      if (!reply) {
        err = new Error('No value');
        err.key = key;
        output.done(err);
        return;
      }
      return output.sendDone({
        out: key});
    });
  });
};
