/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
let baseDir, chai;
const noflo = require('noflo');
const redis = require('redis');

if (!noflo.isBrowser()) {
  chai = require('chai');
  const path = require('path');
  baseDir = path.resolve(__dirname, '../');
} else {
  baseDir = 'noflo-redis';
}

describe('Publish component', function() {
  let c = null;
  let chan = null;
  let msg = null;
  let out = null;
  let err = null;
  let client = null;
  let client2 = null;
  before(function(done) {
    this.timeout(4000);
    const loader = new noflo.ComponentLoader(baseDir);
    return loader.load('redis/Publish', function(err, instance) {
      if (err) { return done(err); }
      c = instance;
      chan = noflo.internalSocket.createSocket();
      c.inPorts.channel.attach(chan);
      msg = noflo.internalSocket.createSocket();
      c.inPorts.message.attach(msg);
      client = redis.createClient();
      client2 = redis.createClient();
      const clientSocket = noflo.internalSocket.createSocket();
      c.inPorts.client.attach(clientSocket);
      clientSocket.send(client2);
      return c.start(done);
    });
  });
  after(done => client.quit(function(err) {
    if (err) { return done(err); }
    return client2.quit(done);
  }));
  beforeEach(function() {
    out = noflo.internalSocket.createSocket();
    c.outPorts.out.attach(out);
    err = noflo.internalSocket.createSocket();
    return c.outPorts.error.attach(err);
  });
  afterEach(function() {
    c.outPorts.out.detach(out);
    out = null;
    c.outPorts.error.detach(err);
    return err = null;
  });

  describe('with a fully-qualified channel name', () => it('should transmit the message to the subscriber', function(done) {
    const channelName = 'regularchannel';
    chan.send(channelName);
    client.subscribe(channelName);

    err.on('data', done);

    client.on('message', function(channel, message) {
      chai.expect(channel).to.equal(channelName);
      chai.expect(message).to.equal('Hello, there!');
      client.unsubscribe();
      return done();
    });

    return client.on('subscribe', function() {
      msg.send('Hello, there!');
      return msg.disconnect();
    });
  }));

  return describe('with a wildcard channel', () => it('should transmit the message to the subscriber', function(done) {
    const channelName = 'wildchannel.foo';
    chan.send(channelName);
    client.psubscribe('wildchannel.*');

    err.on('data', done);

    client.on('pmessage', function(pattern, channel, message) {
      chai.expect(channel).to.equal(channelName);
      chai.expect(message).to.equal('Hello, there!');
      client.punsubscribe();
      return done();
    });

    return client.on('psubscribe', function() {
      msg.send('Hello, there!');
      return msg.disconnect();
    });
  }));
});
