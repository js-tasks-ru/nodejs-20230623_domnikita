const stream = require('node:stream');
const LimitExceededError = require('./LimitExceededError');


class LimitSizeStream extends stream.Transform {
  constructor(options) {
    super(options);

    this._bytesTransmitted = 0;
    this._limit = options.limit;
  }

  _transform(chunk, encoding, callback) {
    this._bytesTransmitted += Buffer.byteLength(chunk, encoding);

    if (this._bytesTransmitted > this._limit) {
      callback(new LimitExceededError());
    } else {
      callback(null, chunk);
    }
  }
}

module.exports = LimitSizeStream;
