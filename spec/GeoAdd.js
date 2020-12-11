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
  before(function () {
    this.timeout(4000);
    const loader = new noflo.ComponentLoader(baseDir);
    return loader.load('redis/GeoAdd')
      .then((instance) => {
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
      });
  });
  after((done) => client.quit(done));
  beforeEach(() => {
    out = noflo.internalSocket.createSocket();
    c.outPorts.out.attach(out);
    err = noflo.internalSocket.createSocket();
    c.outPorts.error.attach(err);
  });
  afterEach((done) => {
    c.outPorts.out.detach(out);
    out = null;
    c.outPorts.error.detach(err);
    err = null;
    function remove() {
      if (!created.length) {
        done();
        return;
      }
      const createdMember = created.shift();
      client.zrem(createdMember.key, createdMember.member, (error) => {
        if (error) {
          done(error);
          return;
        }
        remove();
      });
    }
    remove();
  });

  describe('adding a position', () => it('should persist the member', (done) => {
    err.on('data', done);
    out.on('data', (data) => {
      chai.expect(data).to.equal(1);
      created.push({
        key: 'testset',
        member: 'EFHF',
      });
      client.geopos('testset', 'EFHF', (err, reply) => {
        if (err) { return done(err); }
        chai.expect(parseInt(reply[0][0])).to.equal(60);
        chai.expect(parseInt(reply[0][1])).to.equal(25);
        done();
      });
    });
    key.send('testset');
    member.send('EFHF');
    lat.send(60.254558);
    lon.send(25.042828);
  }));
});
