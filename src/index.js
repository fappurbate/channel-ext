const EventEmitter = require('events');
const RequestTarget = require('@kothique/request-target');

const { Failure } = require('./errors');

const events = new EventEmitter;

fb.cb.onMessage.addHandler((type, timestamp, data) => {
  if (type === 'user-message') {

    const { username, content } = data;
    if (username === fb.runtime.broadcaster && content.startsWith('/fb/channel/')) {
      return { hidden: true };
    }
  } else if (type === 'notice') {
    const { content } = data;
    if (!content.startsWith('/fb/channel/')) { return; }

    const rest = JSON.parse(content.substr('/fb/channel/'.length));
    const [channelName, type] = rest;

    if (type === 'event') {
      const [,, subject, data] = rest;
      events.emit('event', channelName, subject, data);
    } else if (type === 'request') {
      const [,, requestId, subject, data] = rest;
      events.emit('request', channelName, requestId, subject, data);
    } else if (type === 'success') {
      const [,, requestId, data] = rest;
      events.emit('success', channelName, requestId, data);
    } else if (type === 'failure') {
      const [,, requestId, data] = rest;
      events.emit('failure', channelName, requestId, data);
    }

    return { hidden: true };
  }
});

class Channel {
  /**
   * @param {object} options
   * @param {string} options.name - Must not clash with channel names of other bots.
   */
  constructor(options) {
    this._name = options.name;
    this._nextRequestId = 0;
    this._requests = {};

    this._eventHandlers = new EventEmitter;
    this._requestHandlers = new RequestTarget({
      callAllHandlers: true
    });

    this.onEvent = {
      addListener: (subject, callback) => this._eventHandlers.on(subject, callback),
      removeListener: (subject, callback) => this._eventHandlers.off(subject, callback)
    };

    this.onRequest = {
      addHandler: (subject, handler) => this._requestHandlers.on(subject, handler),
      removeHandler: (subject, handler) => this._requestHandlers.off(subject, handler)
    };

    this._listeners = {};

    events.on('event', this._listeners.event = (channelName, subject, data) => {
      if (channelName !== this._name) { return; }

      this._eventHandlers.emit(subject, data);
    });

    events.on('request', this._listeners.request = async (channelName, requestId, subject, data) => {
      if (channelName !== this._name) { return; }

      try {
        const result = await this._requestHandlers.request(subject, data);
        fb.cb.sendMessage(this._createSuccessfulResponse(requestId, result));
      } catch (error) {
        fb.cb.sendMessage(this._createFailingResponse(requestId, error));
      }
    });

    events.on('success', this._listeners.success = (channelName, requestId, data) => {
      if (channelName !== this._name) { return; }

      this._requests[requestId].resolve(data);
    });

    events.on('failure', this._listeners.failure = (channelName, requestId, data) => {
      if (channelName != this._name) { return; }

      this._requests[requestId].reject(data);
    });
  }

  /** Removes all event listeners. After this the channel is not usable anymore.
   */
  close() {
    events.off('failure', this._listeners.failure);
    events.off('success', this._listeners.success);
    events.off('request', this._listeners.request);
    events.off('event', this._listeners.event);
  }

  get name() { return this._name; }

  /**
   * @param {string} subject
   * @param {any?}   data    - Must be serializable.
   */
  emit(subject, data) {
    fb.cb.sendMessage(this._createEvent(subject, data));
  }

  /**
   * @param {string} subject
   * @param {any?}   data
   * @return {Promise}
   * @throws {Failure}
   */
  request(subject, data) {
    const requestId = this._nextRequestId++;

    const promise = new Promise((resolve, reject) => {
      this._requests[requestId] = {
        resolve: data => {
          resolve(data);
          delete this._requests[requestId];
        },
        reject: data => {
          reject(new Failure(data));
          delete this._requests[requestId];
        }
      };
    });

    fb.cb.sendMessage(this._createRequest(requestId, subject, data));

    return promise;
  }

  /**
   * @param {string} subject
   * @param {any?}   data
   * @return {string}
   * @private
   */
  _createEvent(subject, data) {
    return '/fb/channel/' + JSON.stringify(
      [this._name, 'event', subject, data]
    );
  }

  /**
   * @param {string} requestId
   * @param {string} subject
   * @param {any?}   data
   * @return {string}
   * @private
   */
  _createRequest(requestId, subject, data) {
    return '/fb/channel/' + JSON.stringify(
      [this._name, 'request', requestId, subject, data]
    );
  }

  /**
   * @param {number} requestId
   * @param {any?}   data
   * @return {string}
   * @private
   */
  _createSuccessfulResponse(requestId, data) {
    return '/fb/channel/' + JSON.stringify(
      [this._name, 'success', requestId, data]
    );
  }

  /**
   * @param {number} requestId
   * @param {string} message
   * @param {any?}   data
   * @return {string}
   */
  _createFailingResponse(requestId, data) {
    return '/fb/channel/' + JSON.stringify(
      [this._name, 'failure', requestId, data]
    );
  }
}
module.exports = Channel;

Channel.Failure = Failure;
Channel.Channel = Channel;
