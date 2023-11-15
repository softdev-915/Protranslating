import _ from 'lodash';
import ppoResource from '../resources/provider-pooling-offer';
import resourceWrapper from './resource-wrapper';
import BasicService from './basic-service';

const HUMAN_READABLE_DECLINING_REASONS = {
  exceedsCapacity: 'Exceeds capacity',
  annualLeave: 'Annual leave',
  providerTaskInstructionsUnclear: 'Provider Task Instructions Unclear',
  outsideAreaOfExpertise: 'Outside Area of Expertise',
  other: 'Other',
};
const COLUMNS = [
  { name: 'ID', type: 'string', prop: 'offerId', visible: true },
  { name: 'Request No.', type: 'string', prop: 'requestNo', visible: true },
  { name: 'Provider Name', type: 'string', prop: 'providerName', visible: true },
  { name: 'Provider Task', type: 'string', prop: 'providerTaskName', visible: true },
  { name: 'Language Combination', type: 'string', prop: 'languageCombination', visible: true },
  { name: 'Provider Rate', type: 'string', prop: 'providerRate', visible: true },
  { name: 'Notification Sent', type: 'boolean', prop: 'isNotificationSent', visible: true },
  { name: 'Notification Sent Date and Time', type: 'dateRange', prop: 'notificationSentTime', visible: true },
  { name: 'Round No.', type: 'string', prop: 'roundNo', visible: true },
  {
    name: 'Offer Status',
    type: 'string',
    prop: 'status',
    visible: true,
  },
  { name: 'Response Status', type: 'string', prop: 'responseStatus', visible: true },
  {
    name: 'Reason for Declining',
    type: 'string',
    prop: 'decliningReason',
    visible: true,
    val: item => (_.get(HUMAN_READABLE_DECLINING_REASONS, item.decliningReason, '')),
  },
  { name: 'Provider Address', type: 'string', prop: 'providerAddress', visible: false },
  { name: 'Provider ID', type: 'string', prop: 'providerId', visible: false },
  { name: 'Provider Task ID', type: 'string', prop: 'providerTaskId', visible: false },
];

export default class PpoService extends BasicService {
  constructor(resource = ppoResource) {
    super(resource, 'provider-pooling-offer', COLUMNS);
  }

  get name() {
    return 'provider-pooling-service';
  }

  get(id) {
    return resourceWrapper(this.resource.get({ param: id }));
  }

  edit(entity) {
    return resourceWrapper(this.resource.update({ param: entity._id }, entity));
  }

  send(_id) {
    return resourceWrapper(this.resource.save({ param: 'send' }, { _id }));
  }

  close(_id) {
    return resourceWrapper(this.resource.save({ param: 'close' }, { _id }));
  }

  async getNewOfferData({ requestId, workflowId, taskId, providerTaskId }) {
    return resourceWrapper(this.resource.get({
      param: 'get-new-offer-data',
      requestId,
      workflowId,
      providerTaskId,
      taskId,
    }));
  }

  async getOfferTask(requestId, workflowId, taskId) {
    return resourceWrapper(this.resource.get({
      param: 'get-offer-task',
      requestId,
      workflowId,
      taskId,
    }));
  }
}
