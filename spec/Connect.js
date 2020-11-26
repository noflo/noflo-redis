/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
let baseDir, chai;
const noflo = require('noflo');

if (!noflo.isBrowser()) {
  chai = require('chai');
  const path = require('path');
  baseDir = path.resolve(__dirname, '../');
} else {
  baseDir = 'noflo-redis';
}

describe('Connect component', function() {
  let c = null;
  let ins = null;
  let out = null;
  let err = null;
  let client = null;
  before(function(done) {
    this.timeout(4000);
    const loader = new noflo.ComponentLoader(baseDir);
    return loader.load('redis/Connect', function(err, instance) {
      if (err) { return done(err); }
      c = instance;
      ins = noflo.internalSocket.createSocket();
      c.inPorts.url.attach(ins);
      return done();
    });
  });
  after(done => c.shutdown(done));
  beforeEach(function() {
    out = noflo.internalSocket.createSocket();
    c.outPorts.client.attach(out);
    err = noflo.internalSocket.createSocket();
    return c.outPorts.error.attach(err);
  });
  afterEach(function(done) {
    c.outPorts.client.detach(out);
    out = null;
    c.outPorts.error.detach(err);
    err = null;
    if (!client) { return done(); }
    return client.quit(function(err) {
      if (err) { return done(err); }
      client = null;
      return done();
    });
  });
  describe('with an empty URL', () => it('should connect to default Redis', function(done) {
    err.on('data', done);
    out.on('data', function(redis) {
      client = redis;
      chai.expect(client.psubscribe).to.be.a('function');
      return done();
    });
    return ins.send(null);
  }));
  describe('with a correctly-defined URL', () => it('should connect to defined Redis', function(done) {
    err.on('data', done);
    out.on('data', function(redis) {
      client = redis;
      chai.expect(client.psubscribe).to.be.a('function');
      return done();
    });
    return ins.send('redis://localhost:6379');
  }));
  return describe('with an incorrect URL', () => it('should send an error', function(done) {
    err.on('data', function(err) {
      chai.expect(err).to.be.an('error');
      return done();
    });
    out.on('data', redis => done(new Error('Received connection while should not have')));
    return ins.send('redis://localhost:6380');
  }));
});
