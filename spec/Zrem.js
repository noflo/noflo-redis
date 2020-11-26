/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
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

describe('Zrem component', () => {
  let c = null;
  let key = null;
  let member = null;
  let out = null;
  let err = null;
  let client = null;
  before(function (done) {
    this.timeout(4000);
    const loader = new noflo.ComponentLoader(baseDir);
    return loader.load('redis/Zrem', (err, keytance) => {
      if (err) { return done(err); }
      c = keytance;
      key = noflo.internalSocket.createSocket();
      c.inPorts.key.attach(key);
      member = noflo.internalSocket.createSocket();
      c.inPorts.member.attach(member);
      client = redis.createClient();
      const clientSocket = noflo.internalSocket.createSocket();
      c.inPorts.client.attach(clientSocket);
      clientSocket.send(client);
      return done();
    });
  });
  after((done) => client.quit(done));
  beforeEach(() => {
    out = noflo.internalSocket.createSocket();
    c.outPorts.out.attach(out);
    err = noflo.internalSocket.createSocket();
    return c.outPorts.error.attach(err);
  });
  afterEach(() => {
    c.outPorts.out.detach(out);
    out = null;
    c.outPorts.error.detach(err);
    return err = null;
  });

  describe('with a missing key', () => it('should send the key out', (done) => {
    out.on('data', (data) => {
      chai.expect(data).to.eql({
        key: 'testmissingkey',
        member: 'foo',
      });
      return done();
    });

    key.send('testmissingkey');
    member.send('foo');
    return key.disconnect();
  }));

  return describe('with an existing key', () => it('should send the key out', (done) => {
    out.on('data', (data) => {
      chai.expect(data).to.eql({
        key: 'newkey',
        member: 'baz',
      });
      // Check that member was actually removed
      return client.zrange('newkey', 0, 1, (err, val) => {
        chai.expect(val).to.be.eql([]);
        return done();
      });
    });

    return client.zadd('newkey', 1, 'baz', (err, reply) => {
      if (err) { return done(err); }
      key.send('newkey');
      return member.send('baz');
    });
  }));
});
