import _ from 'lodash';
import Vue from 'vue';
import schemaResource from '../resources/schema';
import resourceWrapper from './resource-wrapper';
import lspAwareUrl from '../resources/lsp-aware-url';

export default class SchemaService {
  constructor() {
    this.resource = schemaResource;
    this.selectedEntity = {};
    this._relatedEntities = new Set();
    this.schemas = [];
  }

  set _schemas(value) {
    this.schemas = value;
  }

  get relatedEntities() {
    let fields;
    let clonedEntity;
    return this.schemas.reduce((availableEntities, entity) => {
      fields = this.getFieldsFromEntity(entity);
      fields.forEach((field) => {
        if (field.ref === this.selectedEntity.name) {
          clonedEntity = _.cloneDeep(entity);
          clonedEntity.path = field.path;
          availableEntities.add(clonedEntity);
        }
      });
      return availableEntities;
    }, new Set());
  }
  parseEntityToXPath(selectedEntityName, refFrom, refTo) {
    const paths = refFrom.replace(/\[\]/g, '').split('.');
    let xpath;
    if (paths[0] === selectedEntityName) {
      xpath = `${refTo}[_id = ${refFrom}]`;
    } else {
      const pathsWithoutPrefix = paths.slice(1);
      xpath = `${refTo}[${pathsWithoutPrefix.join('.')} = ${selectedEntityName}._id]`;
    }
    return xpath;
  }
  retrieve() {
    return resourceWrapper(this.resource.get());
  }

  getReferencesFromEntity(entity = {}) {
    const results = [];
    this.selectedEntity = entity;
    results.push(this.getFieldsFromEntity(entity)
      .filter(({ ref }) => !_.isEmpty(ref))
      .map(({ path, ref }) => ({
        refFrom: path, refTo: ref, xpath: this.parseEntityToXPath(entity.name, path, ref) })));
    this.relatedEntities.forEach((relatedEntity) => {
      results.push([{
        refFrom: relatedEntity.path,
        refTo: relatedEntity.name,
        xpath: this.parseEntityToXPath(entity.name, relatedEntity.path, relatedEntity.name),
      }]);
    });
    return _.flatten(results);
  }

  getFieldsFromEntity({ name = '', fields = [], type = '' }, prefix = '') {
    const typeMarker = type === 'Array' ? '[]' : '';
    prefix += `${name}${typeMarker}.`;
    const resultFields = fields.map((field = {}) => {
      if (Array.isArray(field.fields)) {
        return this.getFieldsFromEntity(field, prefix);
      }
      const fieldTypeMarker = field.type === 'Array' ? '[]' : '';
      return { path: `${prefix}${field.name}${fieldTypeMarker}`, type: field.type, ref: field.ref };
    });
    return _.flatten(resultFields);
  }

  getFieldsOptions(field) {
    const url = lspAwareUrl(`schema/field-values/${field}`);
    return resourceWrapper(Vue.http.get(url));
  }
}
