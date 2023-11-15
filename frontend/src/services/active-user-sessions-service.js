import _ from 'lodash';
import sessionResource from '../resources/sessions';
import resourceWrapper from './resource-wrapper';

const COLUMNS = [
  { name: 'User ID', type: 'string', prop: '_id', visible: true },
  { name: 'User Email', type: 'string', prop: 'email', visible: true },
  { name: 'IP', type: 'string', prop: 'originIP', visible: true },
  {
    name: 'User-agent in use',
    type: 'string',
    prop: 'userAgent',
    visible: true,
  },
  {
    name: 'Session ID',
    type: 'string',
    prop: 'sessionId',
    visible: true,
  },
  { name: 'Logged At', type: 'date', prop: 'loggedAt', visible: false },
  { name: 'Last Activity', type: 'date', prop: 'sessionUpdatedAt', visible: false },
  {
    name: 'Time Zone',
    type: 'string',
    prop: 'timeZone',
    val: ({ timeZone }) => {
      if (_.isString(timeZone)) {
        return timeZone;
      }
      return timeZone.value + (timeZone.isAutoDetected ? ' (auto-detected)' : ' (selected)');
    },
    visible: false,
  },
  { name: 'Cookies', type: 'string', prop: 'cookie', visible: false },
  {
    name: 'Location',
    type: 'string',
    prop: 'location',
    val: ({ location }) => `${location.city}, ${location.country}`,
    visible: false,
  },
];

export default class ActiveUserSessionsService {
  constructor(resource = sessionResource) {
    this.resource = resource;
  }

  get columns() {
    return COLUMNS;
  }

  retrieve(params) {
    this.params = Object.assign({}, this.params, params);
    return resourceWrapper(this.resource.get({ params: this.params }));
  }
}
