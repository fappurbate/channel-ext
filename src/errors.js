export class Failure extends fb.Error {
  constructor(data = {}) {
    super(data.message || '', 'ERR_FAILING_RESPONSE', data);
    Error.captureStackTrace(this, Failure);

    this.name = 'Failure';
  }
}
