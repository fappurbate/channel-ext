import EventEmitter from 'events';

const extensionEvents = new EventEmitter;
const testBedEvents = new EventEmitter;

export { testBedEvents as events };

export function sendMessage(type, timestamp, data) {
  extensionEvents.emit('message', type, timestamp, data);
}

class FappurbateError extends Error {
  constructor(message, type, data) {
    super(message);
    Error.captureStackTrace(this, FappurbateError);

    this.name = 'FappurbateError';
    this.type = type;
    this.data = data;
  }
}

export default {
  $events: testBedEvents,
  $sendMessage: sendMessage,
  runtime: {
    broadcaster: 'Basie'
  },
  Error: FappurbateError,
  cb: {
    sendMessage: message => {
      if (message.startsWith('/fb/channel/')) {
        const rest = JSON.parse(message.substr('/fb/channel/'.length));
        const [channelName, type] = rest;

        if (type === 'event') {
          const [,, subject, data] = rest;
          testBedEvents.emit('event', subject, data);
        } else if (type === 'request') {
          const [,, requestId, subject, data] = rest;
          testBedEvents.emit('request', requestId, subject, data);

          if (subject === 'test-success') {
            extensionEvents.emit('message', 'notice', new Date, {
              content: `/fb/channel/${JSON.stringify(
                [channelName, 'success', requestId, { boom: data }]
              )}`
            });
          } else if (subject === 'test-failure') {
            extensionEvents.emit('message', 'notice', new Date, {
              content: `/fb/channel/${JSON.stringify(
                [channelName, 'failure', requestId, { boom: data }]
              )}`
            });
          }
        } else if (type === 'success') {
          const [,, requestId, data] = rest;
          testBedEvents.emit('success', requestId, data);
        } else if (type === 'failure') {
          const [,, requestId, data] = rest;
          testBedEvents.emit('failure', requestId, data);
        }
      }
    },
    onMessage: {
      addHandler: handler => {
        extensionEvents.on('message', async (type, timestamp, data) => {
          const result = await handler(type, timestamp, data);
          testBedEvents.emit('handler', result);
        });
      }
    }
  }
};
