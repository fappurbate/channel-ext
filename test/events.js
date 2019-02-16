import './common';
import Channel from '../src';

describe('events', function () {
  beforeEach(function () {
    this.channel = new Channel({ name: 'test' });
  });

  afterEach(function () {
    this.channel.close();
  });

  it('sends events', function (done) {
    fb.$events.once('event', (subject, data) => {
      expect(subject).to.equal('test');
      expect(data).to.eql({ boom: 42 });
      done();
    });

    this.channel.emit('test', { boom: 42 });
  });

  it('receives events', function (done) {
    this.channel.onEvent.addListener('test', data => {
      expect(data).to.eql({ boom: 42 });
      done();
    });

    fb.$sendMessage(
      'notice',
      new Date,
      { content: '/fb/channel/["test", "event", "test", { "boom": 42 }]' }
    );
  });
});
