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
  c.description = 'Set a Redis entry';
  c.inPorts.add('key',
    {datatype: 'string'});
  c.inPorts.add('value',
    {datatype: 'string'});
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
    {value: ['out', 'error']};

  return c.process(function(input, output) {
    if (!input.hasData('client', 'key', 'value')) { return; }
    let [client, key, value] = Array.from(input.getData('client', 'key', 'value'));

    if (typeof value === 'object') {
      value = JSON.stringify(value);
    }

    return client.set(key, value, function(err, reply) {
      if (err) {
        err.key = key;
        output.done(err);
        return;
      }
      return output.sendDone({
        out: reply});
    });
  });
};
