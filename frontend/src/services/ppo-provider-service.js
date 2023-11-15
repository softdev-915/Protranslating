import _ from 'lodash';
import lspAwareUrl from '../resources/lsp-aware-url';
import ppoResource from '../resources/provider-pooling-offer';
import resourceWrapper from './resource-wrapper';

const COLUMNS = [
  { name: 'ID', type: 'string', prop: '_id', visible: false },
  {
    name: 'Provider Name',
    type: 'string',
    visible: true,
    prop: 'name',
  },
  { name: 'Provider Email Address', type: 'text', visible: true, prop: 'providerEmailAddress' },
  { name: 'Lawyer', type: 'boolean', visible: false, prop: 'isLawyer' },
  { name: 'Practicing', type: 'boolean', visible: false, prop: 'isPracticing' },
  { name: 'Bar Registered', type: 'boolean', visible: false, prop: 'isBarRegistered' },
  { name: 'Provider Address', type: 'string', visible: true, prop: 'address' },
  { name: 'Rate', type: 'string', visible: true, prop: 'rate' },
  { name: 'Tasks Completed for this Company', type: 'string', visible: true, prop: 'completedForThisCompany' },
  { name: 'Tasks in Queue', type: 'component', componentName: 'RequestProviderTasksInQueue', visible: true, prop: 'tasksInQueue' },
];

export default class PpoProviderService {
  constructor(resource = ppoResource) {
    this.resource = resource;
    this.endpointBuilder = lspAwareUrl;
  }

  get name() {
    return 'ppo-provider-service';
  }

  get columns() {
    return COLUMNS;
  }

  retrieve(params) {
    const query = Object.assign(params, { param: 'get-providers' });
    return resourceWrapper(this.resource.get(query))
      .then(this.afterRetrieve);
  }

  afterRetrieve(res) {
    const list = _.get(res, 'data.list');
    if (_.isArray(list)) {
      res.data.list = list.map((item) => {
        item.disableCurrentRowSelection = item.hasTurnedOffOffers;
        return item;
      });
    }
    return res;
  }
}
