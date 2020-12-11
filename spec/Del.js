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

describe('Del component', () => {
  let c = null;
  let ins = null;
  let out = null;
  let err = null;
  const created = [];
  let client = null;
  before(function () {
    this.timeout(4000);
    const loader = new noflo.ComponentLoader(baseDir);
    return loader.load('redis/Del')
      .then((instance) => {
        c = instance;
        ins = noflo.internalSocket.createSocket();
        c.inPorts.key.attach(ins);
        client = redis.createClient();
        const clientSocket = noflo.internalSocket.createSocket();
        c.inPorts.client.attach(clientSocket);
        clientSocket.send(client);
      });
  });
  after((done) => client.del(created, () => client.quit(done)));
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

  describe('with a missing key', () => it('should send the key out', (done) => {
    const expected = [
      '< foo',
      '< bar',
      'testmissingkey',
      '>',
      '>',
    ];
    const received = [];
    out.on('begingroup', (data) => received.push(`< ${data}`));
    out.on('data', (data) => received.push(data));
    out.on('endgroup', (data) => {
      received.push('>');
      if (received.length !== expected.length) { return; }
      chai.expect(received).to.eql(expected);
      done();
    });

    ins.beginGroup('foo');
    ins.beginGroup('bar');
    ins.send('testmissingkey');
    ins.endGroup();
    ins.endGroup();
    ins.disconnect();
  }));

  describe('with an existing key', () => it('should send the key out', (done) => {
    const groups = [];
    let received = false;
    out.on('data', (data) => {
      chai.expect(data).to.equal('newkey');
      received = true;
    });
    out.on('disconnect', () => {
      chai.expect(received).to.equal(true);
      // Check that key was actually removed
      client.get('newkey', (err, val) => {
        chai.expect(val).to.be.a('null');
        done();
      });
    });

    client.set('newkey', 'baz', (err, reply) => {
      if (err) { return done(err); }
      ins.send('newkey');
      ins.disconnect();
    });
  }));
});
