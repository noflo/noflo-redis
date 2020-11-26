const noflo = require('noflo');
const chai = require('chai');
const baseDir = path.resolve(__dirname, '../');

describe('Connect component', () => {
  let c = null;
  let ins = null;
  let out = null;
  let err = null;
  let client = null;
  before(function (done) {
    this.timeout(4000);
    const loader = new noflo.ComponentLoader(baseDir);
    loader.load('redis/Connect', (error, instance) => {
      if (error) {
        done(error);
        return;
      }
      c = instance;
      ins = noflo.internalSocket.createSocket();
      c.inPorts.url.attach(ins);
      done();
    });
  });
  after((done) => c.shutdown(done));
  beforeEach(() => {
    out = noflo.internalSocket.createSocket();
    c.outPorts.client.attach(out);
    err = noflo.internalSocket.createSocket();
    c.outPorts.error.attach(err);
  });
  afterEach((done) => {
    c.outPorts.client.detach(out);
    out = null;
    c.outPorts.error.detach(err);
    err = null;
    if (!client) {
      done();
      return;
    }
    client.quit((error) => {
      if (error) {
        done(error);
        return;
      }
      client = null;
      done();
    });
  });
  describe('with an empty URL', () => it('should connect to default Redis', (done) => {
    err.on('data', done);
    out.on('data', (redis) => {
      client = redis;
      chai.expect(client.psubscribe).to.be.a('function');
      done();
    });
    ins.send(null);
  }));
  describe('with a correctly-defined URL', () => it('should connect to defined Redis', (done) => {
    err.on('data', done);
    out.on('data', (redis) => {
      client = redis;
      chai.expect(client.psubscribe).to.be.a('function');
      done();
    });
    ins.send('redis://localhost:6379');
  }));
  describe('with an incorrect URL', () => it('should send an error', (done) => {
    err.on('data', (error) => {
      chai.expect(error).to.be.an('error');
      done();
    });
    out.on('data', () => done(new Error('Received connection while should not have')));
    ins.send('redis://localhost:6380');
  }));
});
