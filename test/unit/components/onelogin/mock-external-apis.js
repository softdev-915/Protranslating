/* eslint-disable class-methods-use-this */
const Promise = require('bluebird');

class MockExternalAPIService {
  constructor(initialData = []) {
    this.data = initialData;
  }

  findOne(query) {
    const dataLen = this.data.length;
    for (let i = 0; i < dataLen; i++) {
      if (this.data[i].name === query.name) {
        return Promise.resolve(this.data[i]);
      }
    }
    return Promise.resolve(null);
  }

  find(query) {
    const dataLen = this.data.length;
    for (let i = 0; i < dataLen; i++) {
      if (this.data[i].name === query.name) {
        const self = this;
        return {
          toArray() {
            return Promise.resolve([self.data[i]]);
          },
        };
      }
    }
    return { toArray() { return Promise.resolve(null); } };
  }

  insert() {
    throw new Error('Not implemented');
  }

  updateOne(query, object) {
    const dataLen = this.data.length;
    for (let i = 0; i < dataLen; i++) {
      if (this.data[i].name === query.name) {
        this.data[i] = Object.assign({}, this.data[i], object);
        return Promise.resolve();
      }
    }
    this.data.push(object);
    return Promise.resolve();
  }

  removeOne(query) {
    const dataLen = this.data.length;
    let index;
    for (let i = 0; i < dataLen; i++) {
      if (this.data[i].name === query.name) {
        index = i;
      }
    }
    if (index) {
      this.data.splice(index, 1);
    }
    return Promise.resolve();
  }

  collection() {
    return this.db.collection(this.collectionName);
  }
}

module.exports = MockExternalAPIService;
