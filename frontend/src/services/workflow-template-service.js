import resourceWrapper from './resource-wrapper';
import { resource } from '../resources/workflow-template';

const COLUMNS = [
  { name: 'Template ID', type: 'string', prop: '_id', visible: true },
  { name: 'Template Name', type: 'string', prop: 'name', visible: true },
  { name: 'Language Combinations',
    type: 'string',
    prop: 'languageCombinations',
    maxChars: 300,
    visible: true,
  },
  {
    name: 'Inactive',
    type: 'component',
    componentName: 'GridDeleteButton',
    prop: 'deleted',
    visible: true,
  },
];

export default class WorkflowTemplateService {
  constructor() {
    this._resource = resource;
  }

  get columns() {
    return COLUMNS;
  }

  create(data, overwrite) {
    return resourceWrapper(this._resource.save({ overwrite }, data));
  }

  retrieve(filters) {
    return resourceWrapper(this._resource.get(filters));
  }

  retrieveRequestTemplates(requestId) {
    return resourceWrapper(this.resource.get({ requestId }));
  }

  delete(templateId, deleted) {
    return resourceWrapper(this._resource.delete({ templateId, deleted }));
  }

  apply(templateId, data) {
    return resourceWrapper(this._resource.save({ action: 'apply', templateId }, data));
  }
}
