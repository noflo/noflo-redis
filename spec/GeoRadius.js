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

describe('GeoRadius component', function() {
  let c = null;
  let key = null;
  let radius = null;
  let unit = null;
  let lat = null;
  let lon = null;
  let out = null;
  let err = null;
  let client = null;
  before(function(done) {
    this.timeout(4000);
    const loader = new noflo.ComponentLoader(baseDir);
    return loader.load('redis/GeoRadius', function(err, instance) {
      if (err) { return done(err); }
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

  return describe('getting members inside a radius', function() {
    before(done => client.geoadd('testset', 60.254558, 25.042828, 'EFHF', function(err) {
      if (err) { return done(err); }
      return client.geoadd('testset', 60.317222, 24.963333, 'EFHK', done);
    }));
    after(done => client.zrem('testset', 'EFHF', function(err) {
      if (err) { return done(err); }
      return client.zrem('testset', 'EFHK', done);
    }));
    it('should return one member inside small radius', function(done) {
      err.on('data', done);
      out.on('data', function(data) {
        chai.expect(data).to.eql([
          'EFHF'
        ]);
        return done();
      });
      key.send('testset');
      lat.send(60.254558);
      lon.send(25.042828);
      unit.send('km');
      return radius.send(6);
    });
    return it('should return two members inside larger radius', function(done) {
      err.on('data', done);
      out.on('data', function(data) {
        chai.expect(data).to.eql([
          'EFHF',
          'EFHK'
        ]);
        return done();
      });
      key.send('testset');
      lat.send(60.254558);
      lon.send(25.042828);
      unit.send('km');
      return radius.send(11);
    });
  });
});
