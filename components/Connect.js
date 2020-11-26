/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const noflo = require('noflo');
const redis = require('redis');

// @runtime noflo-nodejs

exports.getComponent = function() {
  const c = new noflo.Component;
  c.description = 'Connect to a Redis database identified by a URL';
  c.inPorts.add('url', {
    datatype: 'string',
    description: 'Redis database URL to connect to'
  }
  );
  c.outPorts.add('client',
    {datatype: 'object'});
  c.outPorts.add('error',
    {datatype: 'object'});
  c.forwardBrackets =
    {url: ['client', 'error']};
  return c.process(function(input, output) {
    if (!input.hasData('url')) { return; }
    const url = input.getData('url');
    const client = redis.createClient(url);
    const onError = function(err) {
      client.quit();
      output.done(err);
    };
    client.once('connect', function() {
      client.removeListener('error', onError);
      output.sendDone({
        client});
    });
    return client.once('error', onError);
  });
};
