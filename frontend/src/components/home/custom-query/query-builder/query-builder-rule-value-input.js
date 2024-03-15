import _ from 'lodash';
import UtcFlatpickr from '../../../form/utc-flatpickr.vue';
import DynamicUtcRangeFlatpickr from '../../../form/dynamic-utc-range-flatpickr.vue';
import SimpleBasicSelect from '../../../form/simple-basic-select.vue';
import SchemaService from '../../../../services/schema-service';

const TYPE_FIELD = 'field';
const TYPE_VALUE = 'value';
const TYPE_OPTIONS = [TYPE_FIELD, TYPE_VALUE];
const DATE_TYPE_DATE = 'date';
const DATE_TYPE_RANGE = 'range';
const DATE_TYPE_OPTIONS = [DATE_TYPE_DATE, DATE_TYPE_RANGE];
const FIELD_REF_TO_PATH_DELIMITER = ' → ';
const schemaService = new SchemaService();

export default {
  name: 'custom-query-filter-value-input',
  components: { SimpleBasicSelect, UtcFlatpickr, DynamicUtcRangeFlatpickr },
  props: {
    value: {
      required: true,
    },
    fieldType: {
      type: String,
      required: true,
    },
    field: {
      type: String,
      required: true,
    },
    fieldOptions: {
      type: Array,
      default: () => [],
    },
    error: {
      type: Object,
      default: () => [],
    },
  },
  data() {
    return {
      result: { type: '', value: '' },
      typeError: '',
      valueError: '',
      dateType: '',
      showDateRangePicker: false,
      valueOptions: [],
      selectedOptions: [],
      showValueOptions: false,
    };
  },
  computed: {
    isTypeEmpty() {
      return _.isEmpty(this.result.type);
    },
  },
  watch: {
    result: {
      handler(newResult, oldResult) {
        const newResultType = _.get(newResult, 'type', '');
        const oldResultType = _.get(oldResult, 'type', '');
        const newResultValue = _.get(newResult, 'value', '');
        if (newResultType !== oldResultType && !_.isEmpty(oldResultType)) {
          _.set(this, 'result.value', '');
        } else if (newResultType !== TYPE_FIELD || !_.isEmpty(newResultValue)) {
          this.$emit('input', newResult);
        }
      },
      deep: true,
    },
    value: {
      handler(newValue) {
        if (!_.isEmpty(newValue)) {
          this.result = newValue;
        }
      },
      immediate: true,
    },
    error: {
      handler(newErrors) {
        this.typeError = _.get(newErrors, 'value.type', '');
        this.valueError = _.get(newErrors, 'value.value', '');
      },
      immediate: true,
    },
    showValueOptions(newShowValueOptions) {
      if (newShowValueOptions && _.isEmpty(this.valueOptions)) {
        const fieldToSearch = _.last(this.field.split(FIELD_REF_TO_PATH_DELIMITER))
          .replace(/\[\]/g, '');
        schemaService.getFieldsOptions(fieldToSearch).then(({ data }) => {
          this.valueOptions = _.get(data, 'list', []).map((option) => {
            const value = _.isObject(option) ? Object.values(option)[0] : option;
            return { text: value, value };
          });
        });
      }
    },
  },
  created() {
    this.typeSelectOptions = TYPE_OPTIONS;
    this.dateTypeSelectOptions = DATE_TYPE_OPTIONS;
    const valueType = _.get(this, 'value.type', '');
    if (this.fieldType === 'Date' && valueType === TYPE_VALUE) {
      const actualValue = _.get(this, 'value.value', '');
      this.dateType = actualValue.includes(',') || /^[a-z]+$/i.test(actualValue) ? DATE_TYPE_RANGE : DATE_TYPE_DATE;
    }
    if (Array.isArray(this.result.value)) {
      this.selectedOptions = this.result.value.map((value) => ({ text: value, value }));
    }
  },
  methods: {
    formatFieldSelectOption: (option = {}) => {
      const text = `${option.xpath}.${option.path.split('.').slice(1).join('.')}`;
      return { text, value: option };
    },
    onSelectValueOption(selected) {
      this.selectedOptions = selected;
      this.result.value = selected.map(({ value }) => value);
    },
  },
};
