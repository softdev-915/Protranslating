import _ from 'lodash';
import Vue from 'vue';
import auditResource from '../resources/audit';
import resourceWrapper from './resource-wrapper';
import lspAwareUrl from '../resources/lsp-aware-url';
import extendColumns from '../utils/shared-columns';

const COLUMNS = extendColumns([
  {
    name: 'ID', type: 'string', prop: '_id', visible: false,
  },
  {
    name: 'Date', prop: 'timestamp', type: 'string', visible: true,
  },
  {
    name: 'Url',
    prop: 'req.url',
    type: 'string',
    visible: true,
    val: (item) => item.req.url,
  },
  {
    name: 'User Login',
    prop: 'user.email',
    type: 'string',
    visible: true,
    val: (item) => _.get(item, 'user.email', ''),
  },
  {
    name: 'Status Code',
    prop: 'res.statusCode',
    type: 'string',
    visible: true,
    val: (item) => item.res.statusCode,
  },
  {
    name: 'Request Body',
    prop: 'req.bodyPlainText',
    type: 'longtext',
    visible: true,
    val: (item) => item.req.bodyPlainText || item.req.body || '',
  },
  {
    name: 'Response Body',
    prop: 'res.bodyPlainText',
    type: 'longtext',
    maxChars: 40,
    visible: true,
    val: (item) => {
      const resInfo = (item.res.body) ? JSON.stringify(item.res.body) : '';
      return item.res.bodyPlainText || resInfo;
    },
  },
  {
    name: 'Session Id',
    prop: 'req.sessionID',
    type: 'string',
    visible: true,
    val: (item) => item.req.sessionID,
  },
  {
    name: 'IP',
    prop: 'req.headers.x-forwarded-for',
    type: 'string',
    visible: true,
    val: (item) => {
      // Unwrap tokenization
      const ipTokenList = item.req.headers['x-forwarded-for'] || '';
      return ipTokenList.replace(/^.*,/, '');
    },
  },
  {
    name: 'Method',
    prop: 'req.method',
    type: 'string',
    visible: true,
    val: (item) => item.req.method,
  },
  {
    name: 'Query String',
    prop: 'req.query',
    type: 'string',
    visible: true,
    hideHeaderFilter: true,
    val: (item) => item.req.query,
  },
  {
    name: 'User Agent',
    prop: 'req.headers.user-agent',
    type: 'longtext',
    visible: true,
    val: (item) => item.req.headers['user-agent'],
  },
]);

export default class RequestService {
  constructor(resource = auditResource) {
    this.resource = resource;
  }

  get columns() {
    return COLUMNS;
  }

  retrieve(params) {
    this.params = { ...this.params, ...params };
    return resourceWrapper(this.resource.get({ params: this.params }));
  }

  retrieveAvailableBackups() {
    return resourceWrapper(this.resource.get({ backups: 'backups' }));
  }

  retrieveById(auditId) {
    return resourceWrapper(this.resource.get({ auditId }));
  }

  retrieveCsv() {
    return lspAwareUrl('audit/export');
  }

  restore(data) {
    return resourceWrapper(
      this.resource.update({ backups: 'restore' }, data),
    );
  }

  runScheduler() {
    const url = lspAwareUrl('audit/test-restore-and-backup');
    return resourceWrapper(Vue.http.put(url));
  }

  runScheduler() {
    const url = lspAwareUrl('audit/test-restore-and-backup');
    return resourceWrapper(Vue.http.put(url));
  }
}
