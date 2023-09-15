const Promise = require('bluebird');
const fs = require('fs');
const { mkdirp } = require('mkdirp');
const rimraf = require('rimraf');
const path = require('path');
const { md5 } = require('../../utils/file');

class FileStorage {
  constructor(filePath, logger) {
    this.path = filePath;
    this.logger = logger;
    // needs to be initialized in null.
    this._isDirectory = null;
  }

  _upsertDirectory(fullPath) {
    // Creates dir if not exists, otherwise fails silently
    return this._assertDirectory(fullPath, true);
  }

  _assertDirectory(fullPath, isNewPathDirectory) {
    let pathToAssert = this.path;
    let isDirectory = this._isDirectory;
    if (fullPath) {
      pathToAssert = fullPath;
      isDirectory = isNewPathDirectory;
    }
    let dirname = pathToAssert;
    if (!isDirectory) {
      dirname = path.dirname(pathToAssert);
    }
    this.logger.debug(`Asserting that dir exists ${dirname}`);
    return new Promise((resolve, reject) => {
      mkdirp(dirname, (err) => {
        if (err) {
          this.logger.debug(`Error creating dir ${dirname}. Error: ${err.message}`);
          reject(err);
        } else {
          resolve();
        }
      });
    });
  }

  /**
   * save returns a promise that resolves when the file is saved.
   * @param {String | Buffer} data to be saved.
   * @param {}
   * @returns {Promise} resolves when the file is saved.
   */
  save(data, encoding = 'utf8') {
    this.logger.debug(`Save initialized for file ${this.path}`);
    return new Promise((resolve, reject) => {
      fs.stat(this.path, (errStat) => {
        if (errStat && errStat.code === 'ENOENT') {
          this.logger.debug(`There is no file in path ${this.path}, will save a new file`);
          const callback = (err) => {
            if (err) {
              this.logger.debug(`Error saving file in path ${this.path}. Error: ${err.message}`);
              reject(err);
            } else {
              this.exists(this.path).then(() => {
                this.logger.debug(`Successfully saved file in path ${this.path}`);
                resolve();
              });
            }
          };
          const dirname = path.dirname(this.path);
          this.logger.debug(`Asserting that dir exists ${dirname}`);
          this._assertDirectory(this.path).then(() => {
            this.logger.debug(`Directory ${dirname} asserted. Writing file in path ${this.path}`);
            fs.writeFile(this.path, data, encoding, callback);
          }).catch((err) => {
            this.logger.debug(`failed to save due assert dir ${dirname} to ${this.path}`);
            reject(err);
          });
        } else {
          this.logger.debug(`Error: There is a file in path ${this.path}`);
          reject(new Error('File already exists'));
        }
      });
    });
  }

  /**
   * stat returns a promise that resolves into a file stat (or info) or reject
   * with err.code ENOENT if file is not found.
   * @returns {Promise} resolves to the file's stat, if file is not found it
   * fails with err.code = 'ENOENT'.
   */
  stat() {
    this.logger.debug('Stat: ', this.path);
    return new Promise((resolve, reject) => {
      fs.stat(this.path, (err, stat) => {
        if (err) {
          reject(err);
        } else {
          resolve(stat);
        }
      });
    });
  }

  /**
   * Asserts that the path given is a directory
   */
  isDirectory() {
    if (this._isDirectory !== null) {
      return Promise.resolve(this._isDirectory);
    }
    return this.stat().then((stat) => {
      this._isDirectory = stat.isDirectory();
      return this._isDirectory;
    });
  }

  /**
   * delete returns a promise that resolves when the file or directory is deleted.
   * @param {String | Buffer} data to be saved.
   * @returns {Promise} resolves when the file is saved.
   */
  delete() {
    this.logger.debug('Delete: ', this.path);
    return this.isDirectory().then((isDirectory) => {
      if (isDirectory) {
        return new Promise((resolve, reject) => {
          this.logger.debug('Rmdir: ', this.path);
          rimraf(this.path, (err) => {
            if (err) {
              reject(err);
            } else {
              resolve();
            }
          });
        });
      }
      return new Promise((resolve, reject) => {
        this.logger.debug('Unlink: ', this.path);
        fs.unlink(this.path, (err) => {
          if (err) {
            reject(err);
          } else {
            resolve();
          }
        });
      });
    }).catch((err) => {
      this.logger.debug('Error before removing file: ', this.path, err);
      // we cannot remove files that does not exists
      return new Promise((resolve, reject) => {
        if (err && err.code === 'ENOENT') {
          this.logger.debug('Tried to remove non-existing file: ', this.path, err);
          // it's a success the file does not exists, no need to remove
          resolve();
        } else {
          reject(err);
        }
      });
    });
  }

  /**
   * read given an encoding and a callback it reads the file content.
   * @param {String} encoding the encoding to read (optional).
   * @param {Function} callback called when the file is read.
   */
  read(encoding, callback) {
    if (typeof encoding === 'function') {
      fs.readFile(this.path, encoding);
    } else {
      if (!encoding && !callback) {
        return new Promise((resolve, reject) => {
          fs.readFile(this.path, (err, data) => {
            if (err) {
              reject(err);
            } else {
              resolve(data);
            }
          });
        });
      }
      fs.readFile(this.path, encoding, callback);
    }
  }

  streamRead() {
    return fs.createReadStream(this.path);
  }

  streamWrite(options) {
    return this._assertDirectory(this.path).then(() => fs.createWriteStream(this.path, options));
  }

  exists() {
    return new Promise((resolve) => {
      fs.access(this.path, fs.F_OK, (err) => {
        if (err) {
          resolve(false);
        }
        resolve(true);
      });
    });
  }

  /**
   * saveOrReplace is like save, but if the file exist, is deleted first.
   * @param {String | Buffer} data to be saved.
   * @returns {Promise} resolves when the file is saved.
   */
  saveOrReplace(data) {
    return this.delete().catch((err) => {
      if (err.code !== 'ENOENT') {
        throw err;
      }
    }).then(() => this.save(data));
  }

  copy(toPath) {
    return this.isDirectory()
      .then(isDirectory =>
        this._assertDirectory(toPath, isDirectory)
          .then(() => {
            if (isDirectory) {
              return this._copyDirectory(toPath);
            }
            return this._copyFile(toPath);
          }));
  }

  _copyDirectory(toPath, srcDir) {
    const src = srcDir || this.path;
    return new Promise((resolve, reject) => {
      fs.readdir(src, (err, files) => {
        if (err) {
          reject(err);
        } else {
          resolve(files);
        }
      });
    })
      .then(files => Promise.map(files, file =>
        new Promise((resolve, reject) => {
          fs.lstat(path.join(src, file), (err, stat) => {
            if (err) {
              reject(err);
            } else {
              resolve(stat);
            }
          });
        })
          .then((fileStat) => {
            if (fileStat.isDirectory()) {
              return this._copyDirectory(path.join(toPath, file), path.join(src, file));
            }
            const destination = path.join(toPath, file);
            return this._upsertDirectory(path.dirname(destination))
              .then(() => this._copyFromTo(path.join(src, file), destination));
          })));
  }

  _copyFile(toPath) {
    this._copyFromTo(this.path, toPath);
  }

  _copyFromTo(src, dest) {
    return new Promise((resolve, reject) => {
      let fulfilled = false;
      const readStream = fs.createReadStream(src);
      const writeStream = fs.createWriteStream(dest);
      readStream.on('error', (err) => {
        if (!fulfilled) {
          reject(err);
          fulfilled = true;
        }
      });
      writeStream.on('error', (err) => {
        if (!fulfilled) {
          reject(err);
          fulfilled = true;
        }
      });
      writeStream.on('close', () => {
        if (!fulfilled) {
          resolve();
          fulfilled = true;
        }
      });
      readStream.pipe(writeStream);
    });
  }

  getMd5() {
    return md5(this.path);
  }

  move(newPath) {
    this.logger.debug(`Will move from ${this.path} to ${newPath}`);
    return this._upsertDirectory(path.dirname(newPath))
      .then(() => this.isDirectory())
      .then((isDirectory) => {
      // if it is a directory, we must copy the directory to the new path
      // and then delete, moving it will trigger an error in the
      // file system in both lms-test and lms-prod.
      // It WILL work on localhost, but trust me, IT WILL FAIL in both
      // test and prod
      // https://github.com/GoogleCloudPlatform/gcsfuse/blob/master/internal/fs/fs.go#L1397
        if (isDirectory) {
        // toPath, srcDir
          this.logger.debug(`Copying from ${this.path} to ${newPath}`);
          return this._copyDirectory(newPath, this.path)
            .then(() => {
              this.logger.debug(`dir copied from ${this.path} to ${newPath}, now try to remove`);
              return this.delete();
            })
            .then(() => {
              this.logger.debug(`successfully moved dir ${this.path} to ${newPath}`);
            })
            .catch((err) => {
              this.logger.debug(`failed to move/copy dir ${this.path} to ${newPath}`);
              throw err;
            });
        }
        return new Promise((resolve, reject) => {
        // due to gcs limitation files can be renamed but not dirs
          fs.rename(this.path, newPath, (err) => {
            if (err) {
              this.logger.debug(`failed to rename ${this.path} to ${newPath}`);
              reject(err);
            } else {
              this.path = newPath;
              resolve();
            }
          });
        });
      })
      .catch((err) => {
        const message = err.message || err;
        this.logger.debug(`failed to move due assert dir ${this.path} to ${newPath}. Error: ${message}`);
        throw err;
      });
  }

  rename(newName) {
    const dirname = path.dirname(this.path);
    const newFilePath = path.join(dirname, newName);
    return new Promise((resolve, reject) => {
      fs.rename(this.path, newFilePath, (err) => {
        if (err) {
          reject(err);
        } else {
          this.path = newFilePath;
          resolve();
        }
      });
    });
  }
}

module.exports = FileStorage;
