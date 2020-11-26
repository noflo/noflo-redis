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

describe('Expire component', function() {
  let c = null;
  let key = null;
  let expire = null;
  let out = null;
  let err = null;
  let client = null;
  before(function(done) {
    this.timeout(4000);
    const loader = new noflo.ComponentLoader(baseDir);
    return loader.load('redis/Expire', function(err, keytance) {
      if (err) { return done(err); }
      c = keytance;
      key = noflo.internalSocket.createSocket();
      c.inPorts.key.attach(key);
      expire = noflo.internalSocket.createSocket();
      c.inPorts.expire.attach(expire);
      client = redis.createClient();
      const clientSocket = noflo.internalSocket.createSocket();
      c.inPorts.client.attach(clientSocket);
      clientSocket.send(client);
      return done();
    });
  });
  after(done => client.quit(done));
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

  describe('with a missing key', () => it('should send an error', function(done) {
    err.on('data', function(data) {
      chai.expect(data).to.be.an('error');
      chai.expect(data.message).to.equal('No value');
      chai.expect(data.key).to.equal('testmissingkey');
      return done();
    });

    key.send('testmissingkey');
    return expire.send(60);
  }));

  return describe('with an existing key', function() {
    it('should send the key', function(done) {
      err.on('data', done);
      out.on('data', function(data) {
        chai.expect(data).to.equal('newkey');
        return done();
      });

      return client.set('newkey', 'baz', function(err, reply) {
        if (err) { return done(err); }
        key.send('newkey');
        return expire.send(1);
      });
    });
    return it('should have expired the key', done => setTimeout(() => client.get('newkey', function(err, reply) {
      if (err) { return done(err); }
      chai.expect(reply).to.be.a('null');
      return done();
    })
    , 1100));
  });
});
