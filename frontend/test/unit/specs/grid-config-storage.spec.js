import GridConfigStorage from 'src/utils/grid/grid-config-storage';

const mockGridService = {
  data: {},
  deleteConfig(user, name, configName) {
    if (this.data[user._id] && this.data[user._id][name]) {
      delete this.data[user._id][name][configName];
    }
  },
  save(user, name, gridConfigs) {
    if (!this.data[user._id]) {
      this.data[user._id] = {};
    }
    if (!this.data[user._id][name]) {
      this.data[user._id][name] = {};
    }
    const flattenedConfigs = {};
    gridConfigs.forEach((gc) => {
      flattenedConfigs[gc.configName] = gc.configs;
    });
    this.data[user._id][name] = flattenedConfigs;
  },
  getAllGrids(user) {
    const names = [];
    if (this.data[user._id]) {
      const allNames = Object.keys(this.data[user._id]);
      const allNamesLen = allNames.length;
      for (let i = 0; i < allNamesLen; i++) {
        const configs = [];
        const configKeys = Object.keys(this.data[user._id][allNames[i]]);
        const configKeysLen = configKeys.length;
        for (let j = 0; j < configKeysLen; j++) {
          configs.push({ configName: configKeys[j], configs });
        }
        const grid = { name: allNames[i], configs };

      }
    }
    return names;
  },
};

describe('GridConfigStorage', () => {
  it('should render correct contents', () => {
    const vm = new Vue({
      el: document.createElement('div'),
      render: (h) => h(Hello),
    });
    expect(vm.$el.querySelector('.hello h1').textContent)
      .to.equal('Welcome to Your Vue.js App');
  });
});
