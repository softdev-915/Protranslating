import _ from 'lodash';
import Vue from 'vue';
import notificationResource from '../resources/notification';
import lspAwareUrl from '../resources/lsp-aware-url';
import resourceWrapper from './resource-wrapper';
import extendColumns from '../utils/shared-columns';
import virtualSize from '../utils/filters/virtual-size';

const COLUMNS = extendColumns([
  { name: 'Notification id', type: 'string', prop: '_id', visible: false },
  { name: 'Scheduled date', type: 'date', prop: 'scheduledAt', visible: true },
  { name: 'Subject', prop: 'emailSubject', visible: true },
  {
    name: 'Body',
    type: 'longtext',
    prop: 'emailBody',
    visible: true,
  },
  {
    name: 'Email Connection',
    type: 'string',
    prop: 'emailConnectionString',
    visible: false,
  },
  {
    name: 'Addresses',
    type: 'string',
    prop: 'emailList',
    visible: true,
  },
  {
    name: 'Attachments',
    type: 'string',
    prop: 'email',
    val: (value) => _.get(value, 'email.attachment[1].name'),
    visible: true,
  },
  {
    name: 'Attm. Size',
    type: 'string',
    prop: 'size',
    val: value => virtualSize(_.get(value, 'email.attachment[1].size')),
    visible: true,
  },
  { name: 'Error', type: 'string', prop: 'error', visible: false },
  {
    name: 'Sent date',
    type: 'date',
    prop: 'processed',
    visible: true,
  },
  { name: 'Created by', type: 'string', prop: 'createdBy', visible: false },
  { name: 'Updated by', type: 'string', prop: 'updatedBy', visible: false },
]);

export default class NotificationService {
  constructor(resource = notificationResource) {
    this.resource = resource;
  }

  get columns() {
    return COLUMNS;
  }

  get(notificationId) {
    return resourceWrapper(this.resource.get({ id: notificationId }));
  }

  retrieve(params) {
    this.params = { ...this.params, ...params };
    return resourceWrapper(this.resource.get({ params: this.params }));
  }

  retrieveCsv() {
    return lspAwareUrl('notification/export');
  }

  retrieveAvailableBackups() {
    return resourceWrapper(this.resource.get({ backups: 'backups' }));
  }

  restore(data) {
    return resourceWrapper(
      this.resource.update({ backups: 'restore', period: 'backup' }, data),
    );
  }

  runScheduler() {
    const url = lspAwareUrl('notification/test-restore-and-backup');
    return resourceWrapper(Vue.http.put(url));
  }

  runScheduler() {
    const url = lspAwareUrl('notification/test-restore-and-backup');
    return resourceWrapper(Vue.http.put(url));
  }
}
