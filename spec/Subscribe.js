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

describe('Subscribe component', function() {
  let c = null;
  let chan = null;
  let out = null;
  let err = null;
  let client = null;
  let client2 = null;
  before(function(done) {
    this.timeout(4000);
    const loader = new noflo.ComponentLoader(baseDir);
    return loader.load('redis/Subscribe', function(err, instance) {
      if (err) { return done(err); }
      c = instance;
      chan = noflo.internalSocket.createSocket();
      c.inPorts.channel.attach(chan);
      client = redis.createClient();
      client2 = redis.createClient();
      const clientSocket = noflo.internalSocket.createSocket();
      c.inPorts.client.attach(clientSocket);
      clientSocket.send(client2);
      return c.start(done);
    });
  });
  after(done => c.shutdown(function(err) {
    if (err) { return done(err); }
    return client.quit(function(err) {
      if (err) { return done(err); }
      return client2.quit(done);
    });
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

  describe('with a fully-qualified channel name', () => it('should receive the message', function(done) {
    const expected = [
      'Hello, there!'
    ];
    const received = [];
    out.on('begingroup', group => received.push(`< ${data}`));
    out.on('data', function(data) {
      received.push(data);
      if (received.length !== expected.length) { return; }
      chai.expect(received).to.eql(expected);
      return done();
    });
    out.on('endgroup', function() {
      received.push('>');
      if (received.length !== expected.length) { return; }
      chai.expect(received).to.eql(expected);
      return done();
    });
    c.on('subscribe', () => client.publish('regularchannel', 'Hello, there!'));
    chan.send('regularchannel');
    return chan.disconnect();
  }));

  return describe('with a wildcard channel', () => it('should receive the message', function(done) {
    const expected = [
      'Hello, there!'
    ];
    const received = [];
    out.on('begingroup', group => received.push(`< ${data}`));
    out.on('data', function(data) {
      received.push(data);
      if (received.length !== expected.length) { return; }
      chai.expect(received).to.eql(expected);
      return done();
    });
    out.on('endgroup', function() {
      received.push('>');
      if (received.length !== expected.length) { return; }
      chai.expect(received).to.eql(expected);
      return done();
    });
    c.on('psubscribe', () => client.publish('wildchannel.foo', 'Hello, there!'));
    chan.send('wildchannel.*');
    return chan.disconnect();
  }));
});
