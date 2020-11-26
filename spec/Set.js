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

describe('Set component', () => {
  let c = null;
  let key = null;
  let val = null;
  let out = null;
  let err = null;
  const created = [];
  let client = null;
  before(function (done) {
    this.timeout(4000);
    const loader = new noflo.ComponentLoader(baseDir);
    return loader.load('redis/Set', (err, instance) => {
      if (err) { return done(err); }
      c = instance;
      key = noflo.internalSocket.createSocket();
      c.inPorts.key.attach(key);
      val = noflo.internalSocket.createSocket();
      c.inPorts.value.attach(val);
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
  afterEach((done) => {
    c.outPorts.out.detach(out);
    out = null;
    c.outPorts.error.detach(err);
    err = null;
    var remove = function () {
      if (!created.length) { return done(); }
      const createdKey = created.shift();
      return client.del(createdKey, (err) => {
        if (err) { return done(err); }
        return remove();
      });
    };
    return remove();
  });

  describe('setting a key', () => it('should persist the key', (done) => {
    err.on('data', done);
    out.on('data', (data) => {
      chai.expect(data).to.equal('OK');
      return client.get('testset', (err, reply) => {
        if (err) { return done(err); }
        chai.expect(reply).to.equal('foo');
        created.push('testset');
        return done();
      });
    });
    key.send('testset');
    val.send('foo');
    return val.disconnect();
  }));

  describe('setting multiple keys', () => it('should persist the keys', (done) => {
    const expected = {
      testfirst: 'foo',
      testsecond: 'bar',
    };
    const expectedKeys = Object.keys(expected);
    const receivedKeys = [];

    err.on('data', done);
    out.on('data', (data) => {
      chai.expect(data).to.equal('OK');
      const expectedKey = expectedKeys.shift();
      const expectedVal = expected[expectedKey];
      return client.get(expectedKey, (err, reply) => {
        if (err) { return done(err); }
        chai.expect(reply).to.equal(expectedVal);
        created.push(expectedKey);
        receivedKeys.push(expectedKey);
        if (receivedKeys.length === Object.keys(expected).length) { return done(); }
      });
    });

    for (const keyName in expected) {
      const valContent = expected[keyName];
      key.send(keyName);
      val.send(valContent);
    }
    return val.disconnect();
  }));

  return describe('setting a key with object value', () => it('should persist the key', (done) => {
    err.on('data', done);
    out.on('data', (data) => {
      chai.expect(data).to.equal('OK');
      return client.get('testset', (err, reply) => {
        if (err) { return done(err); }
        const obj = JSON.parse(reply);
        chai.expect(obj.id).to.equal('bergie');
        chai.expect(obj.displayName).to.equal('Henri Bergius');
        created.push('testset');
        return done();
      });
    });
    key.send('testset');
    val.send({
      id: 'bergie',
      displayName: 'Henri Bergius',
    });
    return val.disconnect();
  }));
});
