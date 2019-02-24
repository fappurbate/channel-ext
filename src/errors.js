class Failure extends fb.Error {
  constructor(data = {}) {
    super(data.message || '', 'ERR_FAILURE', data);
    Error.captureStackTrace(this, Failure);

    this.name = 'Failure';
  }
}

module.exports = {
  Failure
};
