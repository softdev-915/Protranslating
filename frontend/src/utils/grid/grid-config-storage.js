import _ from 'lodash';
import Promise from 'bluebird';
import GridService from '../../services/grid-service';

class GridConfigStorage {
  constructor() {
    this.gridService = new GridService();
    this.gridsInCache = [];
  }

  get(gridName) {
    return new Promise((resolve) => {
      this._retrieved.then(() => {
        if (!_.isNil(this.gridsInCache)) {
          const configs = this.gridsInCache.filter((g) => g.grid === gridName);
          return resolve(_.get(configs, '[0].configs'));
        }
        resolve();
      });
    });
  }

  deleteProperConfig(name, configName) {
    const len = this.gridsInCache.length;
    for (let i = 0; i < len; i++) {
      if (this.gridsInCache[i].grid === name) {
        const grid = this.gridsInCache[i];
        for (let j = 0; j < len; j++) {
          if (grid.configs[j].name === configName) {
            grid.configs.splice(j, 1);
            return true;
          }
        }
        return false;
      }
    }
    return false;
  }

  deleteConfig(name, configName) {
    this.deleteProperConfig(name, configName);
    this.gridService.deleteConfig(name, configName);
  }

  setProperConfigs(name, gridConfigs) {
    const len = this.gridsInCache.length;
    for (let i = 0; i < len; i++) {
      if (this.gridsInCache[i].grid === name) {
        this.gridsInCache[i].configs = gridConfigs;
        break;
      }
    }
  }

  save(name, gridConfigs, cb) {
    this.setProperConfigs(name, gridConfigs);
    this.gridService.update(name, gridConfigs).then(() => {
      if (typeof cb === 'function') {
        // retrieve data again
        this.retrieveFromServer().then(() => cb());
      }
    });
  }

  retrieveFromServer() {
    let res;
    let rej;
    this._retrieved = new Promise((resolve, reject) => {
      res = resolve;
      rej = reject;
    });
    return this.gridService.getAllGrids().then((response) => {
      this.gridsInCache = response.data;
      res();
    }).catch(rej);
  }
}

const gridConfigStorage = new GridConfigStorage();

export default gridConfigStorage;

