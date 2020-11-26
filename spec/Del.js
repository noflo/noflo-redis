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

describe('Del component', function() {
  let c = null;
  let ins = null;
  let out = null;
  let err = null;
  const created = [];
  let client = null;
  before(function(done) {
    this.timeout(4000);
    const loader = new noflo.ComponentLoader(baseDir);
    return loader.load('redis/Del', function(err, instance) {
      if (err) { return done(err); }
      c = instance;
      ins = noflo.internalSocket.createSocket();
      c.inPorts.key.attach(ins);
      client = redis.createClient();
      const clientSocket = noflo.internalSocket.createSocket();
      c.inPorts.client.attach(clientSocket);
      clientSocket.send(client);
      return done();
    });
  });
  after(done => client.del(created, () => client.quit(done)));
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

  describe('with a missing key', () => it('should send the key out', function(done) {
    const expected = [
      '< foo',
      '< bar',
      'testmissingkey',
      '>',
      '>'
    ];
    const received = [];
    out.on('begingroup', data => received.push(`< ${data}`));
    out.on('data', data => received.push(data));
    out.on('endgroup', function(data) {
      received.push('>');
      if (received.length !== expected.length) { return; }
      chai.expect(received).to.eql(expected);
      return done();
    });

    ins.beginGroup('foo');
    ins.beginGroup('bar');
    ins.send('testmissingkey');
    ins.endGroup();
    ins.endGroup();
    return ins.disconnect();
  }));

  return describe('with an existing key', () => it('should send the key out', function(done) {
    const groups = [];
    let received = false;
    out.on('data', function(data) {
      chai.expect(data).to.equal('newkey');
      return received = true;
    });
    out.on('disconnect', function() {
      chai.expect(received).to.equal(true);
      // Check that key was actually removed
      return client.get('newkey', function(err, val) {
        chai.expect(val).to.be.a('null');
        return done();
      });
    });

    return client.set('newkey', 'baz', function(err, reply) {
      if (err) { return done(err); }
      ins.send('newkey');
      return ins.disconnect();
    });
  }));
});
