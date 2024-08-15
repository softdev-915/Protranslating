import _ from 'lodash';
import { saveAs } from 'file-saver';
import { mapGetters } from 'vuex';
import VueQueryBuilder from 'vue-query-builder';
import moment from 'moment';
import CustomQueryService from '../../../services/custom-query-service';
import SchemaService from '../../../services/schema-service';
import { entityEditMixin } from '../../../mixins/entity-edit';
import { hasRole } from '../../../utils/user';
import extendColumns from '../../../utils/shared-columns';
import SimpleBasicSelect from '../../form/simple-basic-select.vue';
import QueryBuilderGroup from './query-builder/query-builder-group.vue';
import { getCustomQueryErrors } from './custom-query-validator';
import { getQueryBuilderErrors } from './query-builder/query-builder-validator';
import queryBuilderParser from './query-builder/query-builder-parser';
import CustomQueryPreferenceEdit from './preference/custom-query-preference-edit.vue';
import FileUpload from '../../file-upload/file-upload.vue';

const customQueryService = new CustomQueryService();
const schemaService = new SchemaService();
const emptyField = () => ({
  function: '',
  field: {},
  alias: '',
});
const emptyOrderBy = () => ({ fieldData: {}, sort: '' });
const emptyCustomQuery = () => ({
  _id: '',
  name: '',
  entities: [],
  fields: [emptyField()],
  filter: {},
  groupBy: [{}],
  orderBy: [emptyOrderBy()],
  preferenceId: '',
  deleted: false,
});
const emptyFilterQuery = () => ({ children: [] });
const ENTITY_NAME = 'Custom Query';
const FUNCTION_OPTIONS = ['', 'avg', 'count', 'max', 'min', 'sum', 'first', 'last', 'concat'];
const ADDITIONAL_INFO_FIELDS = extendColumns([]).map(({ prop }) => prop).concat(['lastRunBy', 'lastRunAt']);
const FIELDS_TO_COPY_PASTE = ['name', 'entities', 'fields', 'groupBy', 'orderBy'];

export default {
  name: 'custom-query-edit',
  components: {
    QueryBuilderGroup,
    SimpleBasicSelect,
    VueQueryBuilder,
    CustomQueryPreferenceEdit,
    FileUpload,
  },
  mixins: [entityEditMixin],
  data() {
    return {
      customQuery: emptyCustomQuery(),
      filterQuery: emptyFilterQuery(),
      entities: [],
      showPreferences: false,
      showAdditionalInfo: false,
      savedCustomQuery: {},
      isRunForced: false,
      isLoading: false,
    };
  },
  computed: {
    ...mapGetters('app', ['userLogged']),
    canEdit() {
      return this.canCreate || this.canEditOwn || this.canEditAll;
    },
    canCreate() {
      return this.isNew && hasRole(this.userLogged, 'CUSTOM-QUERY_CREATE_OWN');
    },
    canEditOwn() {
      return _.get(this, 'customQuery.createdBy', '') === _.get(this, 'userLogged.email')
        && hasRole(this.userLogged, 'CUSTOM-QUERY_UPDATE_OWN');
    },
    canEditAll() {
      return hasRole(this.userLogged, 'CUSTOM-QUERY_UPDATE_ALL');
    },
    isNew() {
      return _.isEmpty(_.get(this, 'customQuery._id'));
    },
    isValid() {
      return _.isEmpty(this.error);
    },
    isRunAvailable() {
      if (this.isRunForced) {
        return false;
      }
      const fieldsToCompare = ['entities', 'fields', 'filter', 'groupBy', 'orderBy'];
      const savedData = _.pick(this.savedCustomQuery, fieldsToCompare);
      const dataToSave = _.pick(this.customQueryToSave, fieldsToCompare);
      return _.isEqual(savedData, dataToSave);
    },
    showBreadcrumb() {
      return _.get(this, 'navigationBreadcrumb.length', 0) > 1;
    },
    customQueryJson() {
      return JSON.stringify(_.pick(this.customQuery, FIELDS_TO_COPY_PASTE));
    },
    entitiesSelectOptions() {
      const options = [this.entities.map(entity => ({ entity }))];
      const entities = _.get(this, 'customQuery.entities', []);
      entities.some((entityRow = {}, i) => {
        const selectOptions = schemaService
          .getReferencesFromEntity(entityRow.entity)
          .map(({ refFrom = '', refTo = '', xpath }) => {
            const entity = this.entities.find(({ name = '' }) => name === refTo);
            return !_.isEmpty(entity) ? { refFrom, entity, xpath } : null;
          })
          .concat(i > 0 ? _.last(options) : [])
          .filter((selectOption) => !_.isNil(selectOption) && !_.isEqual(entityRow, selectOption));
        if (_.isEmpty(selectOptions)) {
          return true;
        }
        options.push(_.uniqWith(selectOptions, _.isEqual));
        return false;
      });
      return options;
    },
    fieldSelectOptions() {
      const entities = _.get(this, 'customQuery.entities', []);
      const fields = entities.map(({ entity = {}, refFrom = '', xpath }) =>
        schemaService
          .getFieldsFromEntity(entity)
          .map(fieldRow => Object.assign({}, fieldRow, {
            refFrom,
            xpath: _.defaultTo(xpath, entity.name),
          }))
      );
      return _.flatten(fields);
    },
    groupBySelectOptions() {
      const selected = [];
      const options = [];
      const fields = _.get(this, 'customQuery.fields', [])
        .filter(row => !_.isEmpty(row.field))
        .map(({ field = {} }) => _.pick(field, ['refFrom', 'path', 'xpath']));
      const selectsCount = _.get(this, 'customQuery.groupBy.length', 0);
      for (let i = 0; i <= selectsCount; ++i) {
        const optionsForRow = fields.filter(field =>
          !selected.some(selectedField => _.isEqual(selectedField, field))
        );
        let row = _.get(this, `customQuery.groupBy.${i}`, {});
        row = optionsForRow.find(({ refFrom, path }) =>
          refFrom === row.refFrom && path === row.path);
        options.push(optionsForRow);
        if (_.isEmpty(optionsForRow) || _.isEmpty(row)) {
          break;
        }
        this.customQuery.groupBy[i].xpath = row.xpath;
        selected.push(row);
      }
      return options;
    },
    orderByFieldSelectOptions() {
      const selected = [];
      const options = [];
      const nonAggregatedFields = this.fieldSelectOptions.map(({ refFrom = '', path = '', xpath = '' }) => ({
        function: '',
        field: { refFrom, path, xpath },
        alias: '',
      }));
      const { fields: selectedFields = [] } = this.customQuery;
      const fields = selectedFields
        .map((field) => {
          const result = _.cloneDeep(field);
          const { field: fieldData = {} } = result;
          result.field = _.pick(fieldData, ['refFrom', 'path', 'xpath']);
          return result;
        })
        .filter(({ function: aggregation, field, alias }) => (!_.isEmpty(aggregation) || !_.isEmpty(alias)) && !_.isEmpty(field))
        .concat(nonAggregatedFields);
      const orderBy = _.get(this, 'customQuery.orderBy', []);
      orderBy.some(({ fieldData = {} }) => {
        const optionsForRow = fields.filter(field =>
          !selected.some((selectedField) => {
            if (selectedField.field.path === field.field.path) {
              selectedField.field.xpath = _.get(field, 'field.xpath');
            }
            return _.isEqual(field, selectedField);
          })
        );
        options.push(optionsForRow);
        if (_.isEmpty(optionsForRow)) {
          return true;
        }
        if (!_.isEmpty(fieldData.field)) {
          selected.push(fieldData);
        }
        return false;
      });
      return options;
    },
    filterRules() {
      return this.fieldSelectOptions.map(({ path, type, xpath }) => {
        const ruleName = `${xpath}.${path.split('.').slice(1).join('.')}`;
        const fields = this.fieldSelectOptions
          .filter(({ type: fieldType }) => fieldType === type)
          .map(field => _.pick(field, ['refFrom', 'path', 'xpath']));
        const baseOperators = ['equals', 'does not equal', 'exists', 'does not exists'];
        let typeOperators = [];
        if (['Date', 'Number', 'Decimal128'].includes(type)) {
          typeOperators = ['lower than', 'lower than or equal', 'greater than', 'greater than or equal'];
        } else if (type === 'String') {
          typeOperators = ['contains', 'does not contain', 'begins with', 'ends with'];
        }
        return {
          id: ruleName,
          label: ruleName,
          fields,
          fieldType: type,
          operators: baseOperators.concat(typeOperators),
        };
      });
    },
    error() {
      return {

        ...getCustomQueryErrors(this.customQuery),
        ...getQueryBuilderErrors(this.filterQuery),
      };
    },
    nameError() {
      return _.get(this, 'error.name', '');
    },
    entitiesError() {
      return _.get(this, 'error.entities', '');
    },
    fieldsError() {
      return _.get(this, 'error.fields.common', '');
    },
    fieldFunctionErrorMap() {
      const fieldsCount = _.get(this, 'customQuery.fields.length', 0);
      const map = [];
      for (let i = 0; i < fieldsCount; ++i) {
        const error = _.get(this, `error.fields.${i}.function`, '');
        map.push(error);
      }
      return map;
    },
    fieldPathErrorMap() {
      const fieldsCount = _.get(this, 'customQuery.fields.length', 0);
      const map = [];
      for (let i = 0; i < fieldsCount; ++i) {
        const error = _.get(this, `error.fields.${i}.field`, '');
        map.push(error);
      }
      return map;
    },
    fieldAliasErrorMap() {
      const fieldsCount = _.get(this, 'customQuery.fields.length', 0);
      const map = [];
      for (let i = 0; i < fieldsCount; ++i) {
        const error = _.get(this, `error.fields.${i}.alias`, '');
        map.push(error);
      }
      return map;
    },
    orderByFieldErrorMap() {
      const orderByCount = _.get(this, 'customQuery.orderBy.length', 0);
      const map = [];
      for (let i = 0; i < orderByCount; ++i) {
        const error = _.get(this, `error.orderBy.${i}.fieldData`, '');
        map.push(error);
      }
      return map;
    },
    orderBySortErrorMap() {
      const orderByCount = _.get(this, 'customQuery.orderBy.length', 0);
      const map = [];
      for (let i = 0; i < orderByCount; ++i) {
        const error = _.get(this, `error.orderBy.${i}.sort`, '');
        map.push(error);
      }
      return map;
    },
    allowedRemoveEntityMap() {
      const entitiesOptionsCount = _.get(this, 'entitiesSelectOptions.length', 0);
      const map = [];
      for (let i = 0; i < entitiesOptionsCount; ++i) {
        const entity = _.get(this, `customQuery.entities.${i}`, {});
        map.push(!_.isEmpty(entity) && i !== 0);
      }
      return map;
    },
    allowedMoveFieldDownMap() {
      const fieldsCount = _.get(this, 'customQuery.fields.length', 0);
      const map = [];
      for (let i = 0; i < fieldsCount; ++i) {
        map.push(fieldsCount > 2 && i < (fieldsCount - 2));
      }
      return map;
    },
    allowedMoveFieldUpMap() {
      const fieldsCount = _.get(this, 'customQuery.fields.length', 0);
      const map = [];
      for (let i = 0; i < fieldsCount; ++i) {
        map.push(![0, fieldsCount - 1].includes(i));
      }
      return map;
    },
    allowedRemoveFieldMap() {
      const fieldsCount = _.get(this, 'customQuery.fields.length', 0);
      return this.getAllowedRemoveMapByRowsCount(fieldsCount);
    },
    allowedRemoveGroupByMap() {
      const groupByCount = _.get(this, 'customQuery.groupBy.length', 0);
      return this.getAllowedRemoveMapByRowsCount(groupByCount);
    },
    allowedRemoveOrderByMap() {
      const orderByCount = _.get(this, 'customQuery.orderBy.length', 0);
      return this.getAllowedRemoveMapByRowsCount(orderByCount);
    },
    customQueryToSave() {
      const customQuery = _.cloneDeep(this.customQuery);
      const { entities = [] } = customQuery;
      customQuery.entities = entities.map((entityRow) => {
        const result = { name: _.get(entityRow, 'entity.name', '') };
        const { refFrom = '' } = entityRow;
        if (!_.isEmpty(refFrom)) {
          result.refFrom = refFrom;
        }
        return result;
      });
      customQuery.filter = queryBuilderParser.parse(this.filterQuery);
      if (!_.isEmpty(customQuery.filter)) {
        customQuery.filter.query.children.forEach((child, index) => {
          this.customQuery.entities.slice(1).forEach((entity) => {
            if (child.query.field.includes(entity.xpath)) {
              customQuery.filter.query.children[index].query.field =
                child.query.field.replace(entity.xpath, entity.entity.name);
              customQuery.filter.query.children[index].query.refFrom = entity.refFrom;
            }
          });
        });
      }

      customQuery.groupBy = _.get(this.customQuery, 'groupBy').map(g => _.pick(g, ['refFrom', 'path']));
      _.get(customQuery, 'orderBy', []).forEach((order, i) => {
        if (_.has(order, 'fieldData.field.xpath')) {
          delete customQuery.orderBy[i].fieldData.field.xpath;
        }
      });
      let { fields = [] } = customQuery;
      if (_.isEqual(_.last(fields), emptyField())) {
        fields.pop();
      }
      fields = fields.map((field) => {
        const { field: fieldData = {} } = field;
        field.field = _.pick(fieldData, ['refFrom', 'path']);
        return field;
      });
      const groupBy = _.get(customQuery, 'groupBy', []);
      if (_.isEmpty(_.last(groupBy))) {
        groupBy.pop();
      }
      const orderBy = _.get(customQuery, 'orderBy', []);
      if (_.isEqual(_.last(orderBy), emptyOrderBy())) {
        orderBy.pop();
      }
      return _.omitBy(customQuery, (value, prop) => !_.isBoolean(value) && _.isEmpty(value) && !['filter', 'groupBy', 'orderBy'].includes(prop));
    },
    additionalInfoFields() {
      return ADDITIONAL_INFO_FIELDS.map((field) => {
        const value = _.get(this, `customQuery.${field}`, '');
        return {
          name: field,
          humanName: _.startCase(field),
          e2eName: _.kebabCase(field),
          value: field.slice(-2) === 'At' && !_.isEmpty(value)
            ? moment(value).format('MM-DD-YYYY HH:mm')
            : value,
        };
      });
    },
  },
  created() {
    if (this.isNew) {
      this.retrieveEntities();
    }
    this.entityName = ENTITY_NAME;
    this.functionSelectOptions = FUNCTION_OPTIONS;
  },
  methods: {
    _service: () => customQueryService,
    _handleRetrieve(response) {
      const customQuery = _.get(response, 'data.customQuery', {});
      _.defaults(customQuery, emptyCustomQuery());
      this.savedCustomQuery = _.cloneDeep(customQuery);
      const { orderBy = [] } = customQuery;
      orderBy.push(emptyOrderBy());
      const { groupBy = [] } = customQuery;
      groupBy.push({});
      this.retrieveEntities().then((entities) => {
        const { entities: selectedEntities = [] } = customQuery;
        let fieldSelectOptions = [];
        let entitiesWithRefs = [];
        customQuery.entities = selectedEntities.map(({ refFrom = '', name: selectedEntityName = '' }, index) => {
          const entity = entities.find(({ name = '' }) => selectedEntityName === name);
          entitiesWithRefs = entitiesWithRefs.concat(schemaService.getReferencesFromEntity(entity));
          const entityRef = entitiesWithRefs
            .find(refs => refs.refTo === selectedEntityName && refs.refFrom === refFrom);
          const xpath = index > 0 ? entityRef.xpath : selectedEntityName;
          const entityFields = schemaService.getFieldsFromEntity(entity).map(fieldRow =>
            Object.assign({}, fieldRow, { refFrom, xpath })
          );
          fieldSelectOptions = fieldSelectOptions.concat(entityFields);
          const result = { entity, xpath };
          if (!_.isEmpty(refFrom)) {
            result.refFrom = refFrom;
          }
          return result;
        });
        const { fields = [] } = customQuery;
        customQuery.fields = fields.map((fieldRow) => {
          fieldRow.field = fieldSelectOptions.find(({ refFrom, path }) => _.isEqual(fieldRow.field, { refFrom, path }));
          return fieldRow;
        });
        customQuery.fields.push(emptyField());
        this.customQuery = _.cloneDeep(customQuery);
        this.transformFilterFields(customQuery.filter, fieldSelectOptions);
      });
    },
    _handleCreate(response) {
      const customQuery = _.get(response, 'data.customQuery', {});
      _.defaults(customQuery, emptyCustomQuery());
      _.set(this, 'customQuery._id', _.get(customQuery, '_id', ''));
      this.savedCustomQuery = customQuery;
    },
    _handleEditResponse(response) {
      const customQuery = _.get(response, 'data.customQuery', {});
      _.defaults(customQuery, emptyCustomQuery());
      const newReadDate = _.get(customQuery, 'readDate');
      if (!_.isEmpty(newReadDate)) {
        _.set(this, 'customQuery.readDate', newReadDate);
      }
      this.savedCustomQuery = customQuery;
    },
    _refreshEntity(freshEntity) {
      this.customQuery = freshEntity;
    },
    transformFilterFields(filter, fieldSelectOptions) {
      if (_.isEmpty(filter)) {
        return emptyFilterQuery;
      }
      filter.query.children.map((child, index) => {
        const query = child.query;
        let field = query.field;
        const fieldOption = fieldSelectOptions.find(f => f.path === field);
        if (!_.isEmpty(fieldOption)) {
          const fieldPaths = fieldOption.path.split('.');
          field = `${fieldOption.xpath}.${fieldPaths.slice(1).join('.')}`;
        }
        filter.query.children[index].query.field = field;
        return filter;
      });
      this.filterQuery = queryBuilderParser.parseCustomQueryFilter(filter);
      return this.filterQuery;
    },
    onEntityChange(event, index) {
      const savedEntities = _.get(this, 'savedCustomQuery.entities');
      const isCurrentEntityAbsent = _.isEmpty(this.customQuery.entities[index]);
      if (_.isEmpty(event) && isCurrentEntityAbsent && !_.isEmpty(savedEntities)) {
        const entityForSelection =
          this.entities.find(entity => entity.name === savedEntities[index].name);
        const refFrom = _.get(savedEntities[index], 'refFrom', '');
        const formattedEntity = index > 0 ?
          { refFrom, entity: entityForSelection } :
          { entity: entityForSelection };
        this.customQuery.entities.splice(index, 1, formattedEntity);
      }
    },
    async retrieveEntities() {
      this.httpRequesting = true;
      const response = await schemaService.retrieve();
      this.entities = _.get(response, 'data.list', []);
      schemaService.schemas = this.entities;
      this.httpRequesting = false;
      return this.entities;
    },
    onSelectField(fieldIndex) {
      const fields = _.get(this, 'customQuery.fields', []);
      if (fieldIndex === (fields.length - 1)) {
        fields.push(emptyField());
      }
    },
    onDeleteField(fieldIndex) {
      const fields = _.get(this, 'customQuery.fields', []);
      if (fieldIndex !== (fields.length - 1)) {
        fields.splice(fieldIndex, 1);
      }
    },
    onSelectGroupBy(groupByIndex) {
      const groupBy = _.get(this, 'customQuery.groupBy', []);
      if (groupByIndex === (groupBy.length - 1)) {
        groupBy.push({});
      }
    },
    onDeleteGroupBy(groupByIndex) {
      const groupBy = _.get(this, 'customQuery.groupBy', []);
      if (groupByIndex !== (groupBy.length - 1)) {
        groupBy.splice(groupByIndex, 1);
      }
    },
    onSelectOrderBy(orderByIndex) {
      const orderBy = _.get(this, 'customQuery.orderBy', []);
      if (orderByIndex === (orderBy.length - 1)) {
        orderBy.push(emptyOrderBy());
      }
    },
    onDeleteOrderBy(orderByIndex) {
      const orderBy = _.get(this, 'customQuery.orderBy', []);
      if (orderByIndex !== (orderBy.length - 1)) {
        orderBy.splice(orderByIndex, 1);
      }
    },
    swapFields(fieldIndexA, fieldIndexB) {
      const fields = _.get(this, 'customQuery.fields', []);
      const fieldA = { ..._.get(fields, fieldIndexA, {}) };
      const fieldB = { ..._.get(fields, fieldIndexB, {}) };
      this.$set(fields, fieldIndexA, fieldB);
      this.$set(fields, fieldIndexB, fieldA);
    },
    save() {
      if (this.isValid) {
        this._save(this.customQueryToSave);
      }
    },
    cancel() {
      this.close();
    },
    getAllowedRemoveMapByRowsCount(rowsCount) {
      const map = [];
      for (let i = 0; i < rowsCount; ++i) {
        map.push(rowsCount > 1 && i !== rowsCount - 1);
      }
      return map;
    },
    formatEntitySelectOption: (option) => {
      const { xpath } = option;
      const entityName = _.get(option, 'entity.name', '');
      return {
        text: _.defaultTo(xpath, entityName),
        value: option,
      };
    },
    formatFieldSelectOption: (option = {}) => {
      const text = `${option.xpath}.${option.path.split('.').slice(1).join('.')}`;
      return { text, value: option };
    },
    formatOrderByFieldSelectOption: (option) => {
      const { function: aggregation } = option;
      const { field = {} } = option;
      const fieldName = `${field.xpath}.${field.path.split('.').slice(1).join('.')}`;
      let text = !_.isEmpty(aggregation) ? `${aggregation}(${fieldName})` : fieldName;
      const { alias } = option;
      if (!_.isEmpty(alias)) {
        text += ` as "${alias}"`;
      }
      return { text, value: option };
    },
    onClickRun() {
      if (this.isRunAvailable) {
        this.isRunForced = true;
      }
    },
    async onClickDownload() {
      const copy = _.pick(this.customQuery, FIELDS_TO_COPY_PASTE);
      copy.filterQuery = this.filterQuery;
      try {
        const blob = new Blob([JSON.stringify(copy)], { type: 'text/json' });
        const filename = _.get(this.customQuery, 'name', 'custom-query');
        saveAs(blob, `${filename}.json`);
        this.pushNotification({
          title: 'Info',
          message: 'Preparing to download custom query',
          state: 'info',
        });
      } catch (error) {
        this.pushNotification({
          title: 'Error',
          message: `An error occurred during download action. ${error}`,
          state: 'danger',
        });
      }
    },
    async onUpload(file) {
      if (_.isNil(file) || file.type !== 'application/json') {
        this.pushNotification({
          title: 'Error',
          message: 'Invalid uploaded file type. Accept only json file types.',
          state: 'danger',
        });
        return;
      }
      const content = JSON.parse(await file.text());
      this._updateCustomQuery(content);
    },
    async onClickCopy() {
      const { state } = await navigator.permissions.query({ name: 'clipboard-write' });
      if (state !== 'granted') {
        this.pushNotification({
          title: 'Error',
          message: `You should allow browser make copies to your clipboard for ${window.location.host}. Current state: ${state}`,
          state: 'danger',
        });
        return;
      }
      const copy = _.pick(this.customQuery, FIELDS_TO_COPY_PASTE);
      copy.filterQuery = this.filterQuery;
      copy.isCustomQueryCopy = true;
      try {
        document.getElementById('custom-query-copy').focus();
        await navigator.clipboard.writeText(JSON.stringify(copy));
        this.pushNotification({
          title: 'Success',
          message: 'Custom query copied to the clipboard',
          state: 'success',
        });
      } catch (error) {
        this.pushNotification({
          title: 'Error',
          message: `An error occurred during copy action. ${error}`,
          state: 'danger',
        });
      }
    },
    async onClickPaste() {
      this.isLoading = true;
      const { state } = await navigator.permissions.query({ name: 'clipboard-read' });
      if (state !== 'granted') {
        this.pushNotification({
          title: 'Error',
          message: `You should allow browser to see text and images you copy to the clipboard for ${window.location.host}. Current state: ${state}`,
          state: 'danger',
        });
        this.isLoading = false;
        return;
      }
      document.getElementById('custom-query-paste').focus();
      const pasted = JSON.parse(await navigator.clipboard.readText());
      const { isCustomQueryCopy = false } = pasted;
      if (!isCustomQueryCopy) {
        this.isLoading = false;
        return;
      }
      this._updateCustomQuery(pasted);
      this.isLoading = false;
    },
    _updateCustomQuery(pasted) {
      const copiedCustomQuery = _.pick(pasted, FIELDS_TO_COPY_PASTE);
      _.get(copiedCustomQuery, 'entities', []).forEach((entityData = {}) => {
        entityData.entity = _.find(this.entities, { name: _.get(entityData, 'entity.name') });
      });
      Object.assign(this.customQuery, copiedCustomQuery);
      this.filterQuery = pasted.filterQuery;
    },
  },
};
