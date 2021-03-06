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

describe('GeoPos component', () => {
  let c = null;
  let key = null;
  let member = null;
  let lat = null;
  let lon = null;
  let err = null;
  let client = null;
  before(function () {
    this.timeout(4000);
    const loader = new noflo.ComponentLoader(baseDir);
    return loader.load('redis/GeoPos')
      .then((instance) => {
        c = instance;
        key = noflo.internalSocket.createSocket();
        c.inPorts.key.attach(key);
        member = noflo.internalSocket.createSocket();
        c.inPorts.member.attach(member);
        client = redis.createClient();
        const clientSocket = noflo.internalSocket.createSocket();
        c.inPorts.client.attach(clientSocket);
        clientSocket.send(client);
      });
  });
  after((done) => client.quit(done));
  beforeEach(() => {
    lat = noflo.internalSocket.createSocket();
    c.outPorts.latitude.attach(lat);
    lon = noflo.internalSocket.createSocket();
    c.outPorts.longitude.attach(lon);
    err = noflo.internalSocket.createSocket();
    c.outPorts.error.attach(err);
  });
  afterEach(() => {
    c.outPorts.latitude.detach(lat);
    lat = null;
    c.outPorts.longitude.detach(lon);
    lon = null;
    c.outPorts.error.detach(err);
    err = null;
  });
  describe('with a missing key', () => it('should send an error', (done) => {
    const groups = [];
    const received = false;
    err.on('begingroup', (data) => groups.push(data));
    err.on('endgroup', (data) => groups.pop());
    err.on('data', (data) => {
      chai.expect(data).to.be.an('error');
      chai.expect(data.message).to.equal('No value');
      chai.expect(data.key).to.equal('testmissingkey');
      chai.expect(data.member).to.equal('EFHF');
      chai.expect(groups).to.eql(['foo', 'bar']);
      done();
    });

    key.send('testmissingkey');
    member.beginGroup('foo');
    member.beginGroup('bar');
    member.send('EFHF');
    member.endGroup();
    member.endGroup();
  }));
  describe('with an existing key and member', () => {
    before((done) => client.geoadd('testset', 60.254558, 25.042828, 'EFHF', done));
    after((done) => client.zrem('testset', 'EFHF', done));
    it('should send the coordinates', (done) => {
      const expected = ['latitude', 'longitude'];
      const received = [];
      lat.on('data', (data) => {
        chai.expect(data).to.be.a('number');
        received.push('latitude');
        if (received.length !== expected.length) { return; }
        chai.expect(received).to.eql(expected);
        done();
      });
      lon.on('data', (data) => {
        chai.expect(data).to.be.a('number');
        received.push('longitude');
        if (received.length !== expected.length) { return; }
        chai.expect(received).to.eql(expected);
        done();
      });
      key.send('testset');
      member.send('EFHF');
    });
  });
});
