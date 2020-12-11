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

describe('GeoRadius component', () => {
  let c = null;
  let key = null;
  let radius = null;
  let unit = null;
  let lat = null;
  let lon = null;
  let out = null;
  let err = null;
  let client = null;
  before(function () {
    this.timeout(4000);
    const loader = new noflo.ComponentLoader(baseDir);
    return loader.load('redis/GeoRadius')
      .then((instance) => {
        c = instance;
        key = noflo.internalSocket.createSocket();
        c.inPorts.key.attach(key);
        radius = noflo.internalSocket.createSocket();
        c.inPorts.radius.attach(radius);
        unit = noflo.internalSocket.createSocket();
        c.inPorts.unit.attach(unit);
        lat = noflo.internalSocket.createSocket();
        c.inPorts.latitude.attach(lat);
        lon = noflo.internalSocket.createSocket();
        c.inPorts.longitude.attach(lon);
        client = redis.createClient();
        const clientSocket = noflo.internalSocket.createSocket();
        c.inPorts.client.attach(clientSocket);
        clientSocket.send(client);
      });
  });
  after((done) => client.quit(done));
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

  describe('getting members inside a radius', () => {
    before((done) => client.geoadd('testset', 60.254558, 25.042828, 'EFHF', (err) => {
      if (err) { return done(err); }
      client.geoadd('testset', 60.317222, 24.963333, 'EFHK', done);
    }));
    after((done) => client.zrem('testset', 'EFHF', (err) => {
      if (err) { return done(err); }
      client.zrem('testset', 'EFHK', done);
    }));
    it('should return one member inside small radius', (done) => {
      err.on('data', done);
      out.on('data', (data) => {
        chai.expect(data).to.eql([
          'EFHF',
        ]);
        done();
      });
      key.send('testset');
      lat.send(60.254558);
      lon.send(25.042828);
      unit.send('km');
      radius.send(6);
    });
    it('should return two members inside larger radius', (done) => {
      err.on('data', done);
      out.on('data', (data) => {
        chai.expect(data).to.eql([
          'EFHF',
          'EFHK',
        ]);
        done();
      });
      key.send('testset');
      lat.send(60.254558);
      lon.send(25.042828);
      unit.send('km');
      radius.send(11);
    });
  });
});
