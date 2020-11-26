const chai = require('chai');
const Wrapper = require('noflo-wrapper');

describe('Connect component', () => {
  let client = null;
  const c = new Wrapper('redis/Connect');
  before((done) => c.start(done));
  afterEach((done) => {
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
  describe('with an empty URL', () => {
    it('should connect to default Redis', () => {
      c.send('url', null);
      return c
        .receive('client')
        .then((redis) => {
          client = redis;
          chai.expect(client.psubscribe).to.be.a('function');
        });
    });
  });
  describe('with a correctly-defined URL', () => {
    it('should connect to defined Redis', () => {
      c.send('url', 'redis://localhost:6379');
      return c
        .receive('client')
        .then((redis) => {
          client = redis;
          chai.expect(client.psubscribe).to.be.a('function');
        });
    });
  });
  describe('with an incorrect URL', () => {
    it('should send an error', () => {
      c.send('url', 'redis://localhost:6380');
      return c
        .receive('error')
        .then((error) => {
          chai.expect(error).to.be.an('error');
        });
    });
  });
});
