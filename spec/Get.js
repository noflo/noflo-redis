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

describe('Get component', () => {
  let c = null;
  let ins = null;
  let out = null;
  let err = null;
  const created = [];
  let client = null;
  before(function (done) {
    this.timeout(4000);
    const loader = new noflo.ComponentLoader(baseDir);
    return loader.load('redis/Get', (err, instance) => {
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
      const key = created.shift();
      return client.del(key, (err) => {
        if (err) { return done(err); }
        return remove();
      });
    };
    return remove();
  });

  describe('with a missing key', () => it('should send an error', (done) => {
    const groups = [];
    let received = false;
    err.on('begingroup', (data) => groups.push(data));
    err.on('endgroup', (data) => groups.pop());
    err.on('data', (data) => {
      chai.expect(data).to.be.an('error');
      chai.expect(data.message).to.equal('No value');
      chai.expect(data.key).to.equal('testmissingkey');
      chai.expect(groups).to.eql(['foo', 'bar']);
      return received = true;
    });
    err.on('disconnect', () => {
      chai.expect(received).to.equal(true);
      return done();
    });

    ins.beginGroup('foo');
    ins.beginGroup('bar');
    ins.send('testmissingkey');
    ins.endGroup();
    ins.endGroup();
    return ins.disconnect();
  }));

  describe('with an existing key', () => it('should send the value', (done) => {
    let received = false;
    out.on('data', (data) => {
      chai.expect(data).to.equal('baz');
      return received = true;
    });
    out.on('disconnect', () => {
      chai.expect(received).to.equal(true);
      return done();
    });

    return client.set('newkey', 'baz', (err, reply) => {
      if (err) { return done(err); }
      created.push('newkey');
      ins.send('newkey');
      return ins.disconnect();
    });
  }));

  return describe('with multiple existing keys', () => it('should send the values', (done) => {
    const expected = [
      'baz',
      'bar',
    ];

    const received = false;
    out.on('data', (data) => {
      chai.expect(data).to.equal(expected.shift());
      if (expected.length) { return; }
      return done();
    });

    return client.mset(['newkey', 'baz', 'secondkey', 'bar'], (err) => {
      if (err) { return done(err); }
      created.push('newkey');
      created.push('secondkey');
      ins.send('newkey');
      ins.send('secondkey');
      return ins.disconnect();
    });
  }));
});
