/* eslint-disable import/no-extraneous-dependencies */
const Promise = require('bluebird');
const { Readable, Writable } = require('stream');

class MockFileStorage {
  constructor(filePath, data, error) {
    this.path = filePath;
    this.data = data;
    this.error = error;
  }

  _errorOrSuccess() {
    if (this.error) {
      return Promise.reject(this.error);
    }
    return Promise.resolve(this.data);
  }

  save() {
    return this._errorOrSuccess();
  }

  stat() {
    return this._errorOrSuccess();
  }

  delete() {
    return this._errorOrSuccess();
  }

  read(encoding, callback) {
    process.nextTick(() => {
      if (this.error) {
        callback(this.error);
      } else {
        callback(null, this.data);
      }
    });
  }

  saveOrReplace() {
    return this._errorOrSuccess();
  }

  rename() {
    return this._errorOrSuccess();
  }

  copy() {
    return this._errorOrSuccess();
  }

  move() {
    return this._errorOrSuccess();
  }

  streamRead() {
    const stream = new Readable();
    stream._read = function () {}; // redundant? see update below
    setTimeout(() => {
      if (this.data) {
        stream.push(this.data);
      }
      stream.push(null);
    }, 0);
    return stream;
  }
  streamWrite() {
    const stream = new Writable();
    stream._write = function (data) {
      this.data += data;
    };
    stream._final = function () {

    };
    return stream;
  }
  exists() {
    if (this.data) {
      return Promise.resolve(true);
    }
    return Promise.resolve(false);
  }

  _assertDirectory() {
    return Promise.resolve();
  }
}

module.exports = MockFileStorage;
