const { Channel, Failure } = require('../src');

describe('requests', function () {
  beforeEach(function () {
    this.channel = new Channel({ name: 'test' });
  });

  afterEach(function () {
    this.channel.close();
  });

  it('sends request & receives successful response', function () {
    return expect(
      this.channel.request('test-success', { myData: 42 })
    ).to.eventually.eql({ boom: { myData: 42 } });
  });

  it('sends request & receives failing response', async function () {
    try {
      await this.channel.request('test-failure', { myData: 42 })
    } catch (error) {
      expect(error).to.be.an.instanceof(Failure);
      expect(error.data).to.eql({ boom: { myData: 42 } });
      return;
    }

    throw new Error('should have failed');
  });

  it('handles request successfully', function (done) {
    this.channel.onRequest.addHandler('test', data => {
      return { boom: data };
    });

    const listeners = {};

    fb.$events.on('success', listeners.success = (requestId, data) => {
      fb.$events.off('success', listeners.success);
      fb.$events.off('failure', listeners.failure);
      expect(data).to.eql({ boom: { myData: 42 } });
      done();
    });

    fb.$events.on('failure', listeners.failure = (requestId, data) => {
      fb.$events.off('success', listeners.success);
      fb.$events.off('failure', listeners.failure);
      done(new Error('should have succeeded'));
    });

    fb.$sendMessage(
      'notice',
      new Date,
      { content: '/fb/channel/["test", "request", 0, "test", { "myData": 42 }]' }
    );
  });

  it('handles request with an error', function (done) {
    this.channel.onRequest.addHandler('test', data => {
      throw { boom: data };
    });

    const listeners = {};

    fb.$events.on('success', listeners.success = (requestId, data) => {
      fb.$events.off('success', listeners.success);
      fb.$events.off('failure', listeners.failure);
      done(new Error('should have failed'));
    });

    fb.$events.on('failure', listeners.failure = (requestId, data) => {
      fb.$events.off('success', listeners.success);
      fb.$events.off('failure', listeners.failure);
      expect(data).to.eql({ boom: { myData: 42 } });
      done();
    });

    fb.$sendMessage(
      'notice',
      new Date,
      { content: '/fb/channel/["test", "request", 0, "test", { "myData": 42 }]' }
    );
  });

  it('all handlers are called', function () {
    let called = 0;
    this.channel.onRequest.addHandler('test', () => called++);
    this.channel.onRequest.addHandler('test', () => called++);

    fb.$sendMessage(
      'notice',
      new Date,
      { content: '/fb/channel/["test", "request", 0, "test", { "myData": 42 }]' }
    );
    expect(called).to.equal(2);
  });
});
