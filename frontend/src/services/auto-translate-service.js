import Vue from 'vue';
import _ from 'lodash';
import resourceWrapper from './resource-wrapper';
import lspAwareUrl from '../resources/lsp-aware-url';
import autoTranslateResource from '../resources/auto-translate';

export default class AutoTranslateService {
  constructor(resource = autoTranslateResource) {
    this.resource = resource;
  }

  runScheduler(scheduler, schedulerParams) {
    const entity = _.get(schedulerParams, 'entity', '');
    const entityId = _.get(schedulerParams, 'entityId', '');
    const url = lspAwareUrl(`auto-translate-schedulers/${scheduler.name}/runNow`);
    return resourceWrapper(Vue.http.post(url, { entity, entityId }));
  }
}
