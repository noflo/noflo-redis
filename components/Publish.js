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
  c.icon = 'paper-plane';
  c.description = 'Publish a message into a specified channel';
  c.inPorts.add('channel', {
    datatype: 'string',
    description: 'Channel to publish to'
  }
  );
  c.inPorts.add('message', {
    datatype: 'string',
    description: 'Message to publish'
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
    {value: ['out', 'error']};

  return c.process(function(input, output) {
    if (!input.hasData('client', 'channel', 'message')) { return; }
    const [client, channel, message] = Array.from(input.getData('client', 'channel', 'message'));
    return client.publish(channel, message, function(err, reply) {
      if (err) {
        err.channel = channel;
        output.done(err);
        return;
      }
      return output.sendDone({
        out: reply});
    });
  });
};
