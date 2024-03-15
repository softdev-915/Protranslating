import _ from 'lodash';
import { sortWidgets } from '../helpers';

export default {
  created() {
    const config = this.resolveConfig();
    this.applySetConfig(this.prepareConfig(config));
  },
  methods: {
    applySetConfig(config) {
      const widgetConfigs = _.get(config, 'widgets', []);
      const widgets = [];
      _.forEach(widgetConfigs, (widgetConfig, index) => {
        const widgetObj = _.get(this, 'setConfig.widgets', []).find(widget =>
          _.get(widget, 'name', false) === _.get(widgetConfig, 'name', true));
        if (!_.isNil(widgetObj)) {
          const newConfig = Object.assign({}, widgetObj.config, widgetConfig.config);
          widgets[index] = Object.assign({}, widgetObj, { config: newConfig });
        }
      });
      const setConfig = Object.assign({}, this.value, { widgets: sortWidgets(widgets) });
      if (!_.isEmpty(config.leftWidth)) {
        setConfig.leftWidth = config.leftWidth;
      }
      this.setConfig = setConfig;
    },
  },
};
