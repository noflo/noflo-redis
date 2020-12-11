let baseDir; let
  chai;
const noflo = require('noflo');
const redis = require('redis');

if (!noflo.isBrowser()) {
  chai = require('chai');
  const path = require('path');
  baseDir = path.resolve(__dirname, '../');
} else {
  baseDir = 'noflo-redis';
}

describe('Subscribe component', () => {
  let c = null;
  let chan = null;
  let out = null;
  let err = null;
  let client = null;
  let client2 = null;
  before(function () {
    this.timeout(4000);
    const loader = new noflo.ComponentLoader(baseDir);
    return loader.load('redis/Subscribe')
      .then((instance) => {
        c = instance;
        chan = noflo.internalSocket.createSocket();
        c.inPorts.channel.attach(chan);
        client = redis.createClient();
        client2 = redis.createClient();
        const clientSocket = noflo.internalSocket.createSocket();
        c.inPorts.client.attach(clientSocket);
        clientSocket.send(client2);
        return c.start();
      });
  });
  after((done) => {
    c.shutdown()
      .then(() => {
        client.quit((err) => {
          if (err) { return done(err); }
          client2.quit(done);
        });
      }, done);
  });
  beforeEach(() => {
    out = noflo.internalSocket.createSocket();
    c.outPorts.out.attach(out);
    err = noflo.internalSocket.createSocket();
    c.outPorts.error.attach(err);
  });
  afterEach(() => {
    c.outPorts.out.detach(out);
    out = null;
    c.outPorts.error.detach(err);
    err = null;
  });

  describe('with a fully-qualified channel name', () => it('should receive the message', (done) => {
    const expected = [
      'Hello, there!',
    ];
    const received = [];
    out.on('begingroup', (group) => received.push(`< ${data}`));
    out.on('data', (data) => {
      received.push(data);
      if (received.length !== expected.length) { return; }
      chai.expect(received).to.eql(expected);
      done();
    });
    out.on('endgroup', () => {
      received.push('>');
      if (received.length !== expected.length) { return; }
      chai.expect(received).to.eql(expected);
      done();
    });
    c.on('subscribe', () => client.publish('regularchannel', 'Hello, there!'));
    chan.send('regularchannel');
    chan.disconnect();
  }));

  describe('with a wildcard channel', () => it('should receive the message', (done) => {
    const expected = [
      'Hello, there!',
    ];
    const received = [];
    out.on('begingroup', (group) => received.push(`< ${data}`));
    out.on('data', (data) => {
      received.push(data);
      if (received.length !== expected.length) { return; }
      chai.expect(received).to.eql(expected);
      done();
    });
    out.on('endgroup', () => {
      received.push('>');
      if (received.length !== expected.length) { return; }
      chai.expect(received).to.eql(expected);
      done();
    });
    c.on('psubscribe', () => client.publish('wildchannel.foo', 'Hello, there!'));
    chan.send('wildchannel.*');
    chan.disconnect();
  }));
});
