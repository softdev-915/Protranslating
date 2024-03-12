import _ from 'lodash';
import TextCustomField from './custom-fields/text-custom-field.vue';
import TextEditorCustomField from './custom-fields/text-editor-custom-field.vue';
import DropdownCustomField from './custom-fields/dropdown-custom-field.vue';
import ButtonGroupCustomField from './custom-fields/button-group-custom-field.vue';
import InputCustomField from './custom-fields/input-custom-field.vue';
import SelectableTextEditorCustomField from './custom-fields/selectable-text-editor-custom-field.vue';

export default {
  components: {
    TextCustomField,
    TextEditorCustomField,
    DropdownCustomField,
    ButtonGroupCustomField,
    InputCustomField,
    SelectableTextEditorCustomField,
  },
  props: {
    label: {
      required: true,
      type: String,
    },
    customFieldTypes: {
      required: true,
      type: Array,
    },
    customFieldValues: {
      required: true,
      type: Object,
    },
    needSave: {
      type: Boolean,
      default: false,
    },
    shouldShowSaveChangesButton: {
      type: Boolean,
      default: true,
    },
    hiddenFields: {
      type: Array,
      default: [],
    },
    hideableFields: {
      type: Array,
      default: () => ([]),
    },
  },
  data() {
    return {
      opened: true,
      validCustomFieldList: [],
    };
  },
  computed: {
    fieldComponentsData() {
      const result = [];
      const componentTypeMap = {
        text: 'TextCustomField',
        'text-editor': 'TextEditorCustomField',
        dropdown: 'DropdownCustomField',
        'button-group': 'ButtonGroupCustomField',
        input: 'InputCustomField',
        'selectable-text-editor': 'SelectableTextEditorCustomField',
      };
      this.customFieldTypes.forEach((field) => {
        const componentName = _.get(componentTypeMap, field.type);
        if (_.isNil(componentName)) {
          return;
        }
        const value = _.get(this.customFieldValues, field.templateKey, null);
        result.push({
          ...field,
          componentName,
          value,
        });
      });
      return result;
    },
    needSaveSync: {
      get() {
        return this.needSave;
      },
      set(newValue) {
        this.$emit('update:needSave', newValue);
      },
    },
  },
  methods: {
    setCustomFieldValue(value, customFieldTemplateKey, onChange) {
      if (!_.has(this.customFieldValues, customFieldTemplateKey)) {
        return;
      }
      const newCustomFieldValues = { ...this.customFieldValues };
      newCustomFieldValues[customFieldTemplateKey] = value;
      if (_.isFunction(onChange)) {
        onChange(value, newCustomFieldValues);
      }
      this.$emit('update:customFieldValues', newCustomFieldValues);
    },
    toggleList() {
      this.opened = !this.opened;
    },
    setValidCustomField(value, customFieldTemplateKey) {
      this.validCustomFieldList[customFieldTemplateKey] = value;
      const areContainError = Object.keys(this.validCustomFieldList).some(
        customFieldKey => this.validCustomFieldList[customFieldKey] === false
      );
      this.$emit('are-valid-custom-fields', !areContainError);
    },
    isFieldHidden(templatePath, templateKey) {
      return this.hiddenFields.includes(`${templatePath}.${templateKey}`);
    },
    toggleIsFieldHidden(templatePath, templateKey) {
      const fieldPathKey = `${templatePath}.${templateKey}`;
      const fieldIndex = this.hiddenFields.findIndex(field => field === fieldPathKey);
      const hiddenFields = fieldIndex === -1
        ? [...this.hiddenFields, fieldPathKey]
        : this.hiddenFields.filter(field => field !== fieldPathKey);
      this.$emit('set-hidden-fields', hiddenFields);
    },
    canHideField(templatePath, templateKey) {
      return this.hideableFields.includes(`${templatePath}.${templateKey}`);
    },
  },
};
