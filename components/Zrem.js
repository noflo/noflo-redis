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
  c.description = 'Remove a member from a sorted set';
  c.icon = 'trash';
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
  c.outPorts.add('out',
    {datatype: 'string'});
  c.outPorts.add('error',
    {datatype: 'object'});

  c.forwardBrackets =
    {member: ['out', 'error']};

  return c.process(function(input, output) {
    if (!input.hasData('client', 'key', 'member')) { return; }
    const [client, key, member] = Array.from(input.getData('client', 'key', 'member'));
    client.zrem(key, member, function(err, reply) {
      if (err) {
        err.key = key;
        err.member = member;
        output.done(err);
        return;
      }
      return output.sendDone({
        out: {
          key,
          member
        }
      });
    });
  });
};
