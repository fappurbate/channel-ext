const Channel = require('../src');

describe('requests', function () {
  beforeEach(function () {
    this.channel = new Channel({ name: 'test' });
  });

  afterEach(function () {
    this.channel.close();
  });

  it('unsubscribes from events', function (done) {
    const listeners = {};

    let count = 0;

    this.channel.onEvent.addListener('test', listeners.event = data => {
      expect(data).to.eql({ bim: 'bam' });
      count++;
    });

    fb.$sendMessage(
      'notice',
      new Date,
      { content: '/fb/channel/[ "test", "event", "test", { "bim": "bam" }]' }
    );

    this.channel.onEvent.removeListener('test', listeners.event);

    fb.$sendMessage(
      'notice',
      new Date,
      { content: '/fb/channel/[ "test", "event", "test", { "bim": "bam" }]' }
    );

    setTimeout(() => {
      expect(count).to.equal(1);
      done();
    });
  });

  it('unsubscribes from requests', function (done) {
    const listeners = {};

    let count = 0;

    this.channel.onRequest.addHandler('test', listeners.handler = data => {
      expect(data).to.eql({ bim: 'bam' });
      count++;
      return { 'Miss Lou': 'Maas Ran' };
    });

    fb.$sendMessage(
      'notice',
      new Date,
      { content: '/fb/channel/[ "test", "request", 0, "test", { "bim": "bam" }]' }
    );

    this.channel.onRequest.removeHandler('test', listeners.handler);

    fb.$sendMessage(
      'notice',
      new Date,
      { content: '/fb/channel/[ "test", "request", 0, "test", { "bim": "bam" }]' }
    );

    setTimeout(() => {
      expect(count).to.equal(1);
      done();
    });
  });
});
