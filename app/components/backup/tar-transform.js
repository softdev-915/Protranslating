const BSON = require('bson');
const { Writable } = require('stream');
const TarPack = require('tar-stream').pack;
const duplexer = require('duplexer2');

class MongoCollection2Tar extends Writable {
  constructor(options) {
    super({ ...options, objectMode: true });
    const { tarPack, dbName, colName } = options;
    this._tarPak = tarPack;
    this.once('finish', () => this._tarPak.finalize());
    this.prefix = `/${dbName}/${colName}`;
    this._tarPak.entry({ name: `/${dbName}`, type: 'directory' });
    this._tarPak.entry({ name: this.prefix, type: 'directory' });
  }

  _write(doc, _, cb) {
    const name = `${this.prefix}/${doc._id.toHexString()}.bson`;
    const buffer = BSON.serialize(doc);
    this._tarPak.entry({ name, type: 'file' }, buffer, cb);
  }
}

module.exports = function pack(config) {
  const tarPack = new TarPack();
  return duplexer(
    { writableObjectMode: true },
    new MongoCollection2Tar({ ...config, tarPack }),
    tarPack,
  );
};
