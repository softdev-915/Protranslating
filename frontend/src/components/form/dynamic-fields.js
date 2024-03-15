import UtcFlatpickr from './utc-flatpickr.vue';
import { capitalizeFirstLetter } from '../../utils/strings';
import SimpleBasicSelect from './simple-basic-select.vue';

const TYPES_LIST = [
  'text',
  'date',
  'number',
];

export default {
  components: { UtcFlatpickr, SimpleBasicSelect },
  props: {
    value: Object,
  },
  created() {
    this._setOptions(this.value);
    this.newTypeSelectOptions = TYPES_LIST;
  },
  data() {
    return {
      options: {},
      additionalValues: {},
      additionalSchema: {},
      showNewPropertyEdit: false,
      newName: '',
      newType: 'text',
      newValidation: '',
      originalName: '',
      originalSchema: {},
      originalValue: null,
      datepickerOptions: {
        onValueUpdate: null,
        enableTime: true,
        allowInput: false,
        disableMobile: 'true',
        minDate: null,
      },
    };
  },
  watch: {
    value: {
      handler(newValue) {
        this._setOptions(newValue);
      },
      immediate: true,
    },
    typeSelected(newType) {
      this.$set(this, 'newType', newType);
    },
  },
  computed: {
    allProps() {
      if (this.additionalSchema) {
        return Object.keys(this.additionalSchema);
      }
      return [];
    },
    isValidNewProp() {
      return this.newName !== '' && this.allProps.indexOf(this.newName) === -1;
    },
    addText() {
      return this.existingProp ? 'Edit' : 'Add';
    },
  },
  methods: {
    editProp(prop) {
      this.showNewPropertyEdit = true;
      this.existingProp = true;
      this.newName = prop;
      this.newType = this.additionalSchema[prop].type;
      this.newValidation = this.additionalSchema[prop].validation;
      this.originalName = prop;
      this.originalSchema = this.additionalSchema[prop];
      this.originalValue = this.additionalValues[prop];
      this.removeProp(prop);
      this.showNewPropertyEdit = true;
    },
    showAddProperty() {
      this.showNewPropertyEdit = true;
    },
    addProperty() {
      this.existingProp = false;
      this.showNewPropertyEdit = false;
      const newSchema = { type: this.newType, validation: this.newValidation };
      this.$set(this.additionalSchema, this.newName, newSchema);
      this.$set(this.additionalValues, this.newName, null);
      this.originalSchema = {};
      this.originalValue = null;
      this.newName = '';
      this.newType = 'text';
      this.newValidation = '';
    },
    removeProp(prop) {
      this.$delete(this.additionalSchema, prop);
      this.$delete(this.additionalValues, prop);
    },
    cancelProperty() {
      this.existingProp = false;
      this.showNewPropertyEdit = false;
      this.newName = '';
      this.newType = 'text';
      this.newValidation = '';
    },
    onValueChange(data, prop) {
      if (data !== null) {
        this.additionalValues[prop] = data;
        this.onOptionUpdate(data, prop);
      }
    },
    onOptionUpdate(data, prop) {
      if (!this.options) {
        this.options = {};
      }
      this.options.additionalValues[prop] = this.additionalValues[prop];
      this.options.additionalSchema[prop] = this.additionalSchema[prop];
      this.$emit('input', this.options);
    },
    _setOptions(value) {
      if (value) {
        this.options = value;
        if (this.options) {
          if (this.options.additionalValues) {
            this.$set(this, 'additionalValues', this.options.additionalValues);
          }
          if (this.options.additionalSchema) {
            this.$set(this, 'additionalSchema', this.options.additionalSchema);
          }
        }
      }
    },
    formatNewTypeSelectOption: (option) => ({ text: capitalizeFirstLetter(option), value: option }),
  },
};
