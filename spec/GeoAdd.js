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

describe('GeoAdd component', () => {
  let c = null;
  let key = null;
  let member = null;
  let lat = null;
  let lon = null;
  let out = null;
  let err = null;
  const created = [];
  let client = null;
  before(function (done) {
    this.timeout(4000);
    const loader = new noflo.ComponentLoader(baseDir);
    return loader.load('redis/GeoAdd', (err, instance) => {
      if (err) { return done(err); }
      c = instance;
      key = noflo.internalSocket.createSocket();
      c.inPorts.key.attach(key);
      member = noflo.internalSocket.createSocket();
      c.inPorts.member.attach(member);
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
      const createdMember = created.shift();
      return client.zrem(createdMember.key, createdMember.member, (err) => {
        if (err) { return done(err); }
        return remove();
      });
    };
    return remove();
  });

  return describe('adding a position', () => it('should persist the member', (done) => {
    err.on('data', done);
    out.on('data', (data) => {
      chai.expect(data).to.equal(1);
      created.push({
        key: 'testset',
        member: 'EFHF',
      });
      return client.geopos('testset', 'EFHF', (err, reply) => {
        if (err) { return done(err); }
        chai.expect(parseInt(reply[0][0])).to.equal(60);
        chai.expect(parseInt(reply[0][1])).to.equal(25);
        return done();
      });
    });
    key.send('testset');
    member.send('EFHF');
    lat.send(60.254558);
    return lon.send(25.042828);
  }));
});
