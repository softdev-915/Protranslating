<template>
  <div class="row align-items-center mt-2">
    <template v-if="fieldComponentsData.length > 0">
      <div class="col-12">
        <h6>{{ label }}</h6>
      </div>
      <div
        v-for="fieldComponentData in fieldComponentsData"
        :key="fieldComponentData.templateKey"
        class="col-12"
      >
        <component
          :is="fieldComponentData.componentName"
          @input="setCustomFieldValue($event, fieldComponentData.templateKey, fieldComponentData.onChange)"
          :value="fieldComponentData.value"
          :label="fieldComponentData.label"
          :placeholder="fieldComponentData.placeholder"
          :template-key="fieldComponentData.templateKey"
          :template-path="fieldComponentData.templatePath"
          :validate-rules="fieldComponentData.validateRules"
          :options="fieldComponentData.options"
          :componentOptions="fieldComponentData.componentOptions"
          :is-hidden="isFieldHidden(fieldComponentData.templatePath, fieldComponentData.templateKey)"
          :can-hide-field="canHideField(fieldComponentData.templatePath, fieldComponentData.templateKey)"
          :read-only="fieldComponentData.readOnly"
          @toggle-is-hidden="toggleIsFieldHidden(fieldComponentData.templatePath, fieldComponentData.templateKey)"
          @is-valid-custom-field="setValidCustomField($event, fieldComponentData.templateKey)"
          :data-e2e-cf-type="`custom-field-component-${fieldComponentData.templatePath}`"
          :data-e2e-cf-key="fieldComponentData.templateKey"
        ></component>
      </div>
      <div class="col-12 my-4">
        <label data-e2e-type="hideable-fields-label">Select the Custom fields that should have a Show/Hide toggle</label>
        <multi-select
          :selected-options="selectedHideableFieldsOptions"
          :options="hideableFieldsOptions"
          @select="onHideableFieldsSelected"
          data-e2e-type="hideable-fields-dropdown">
        </multi-select>
      </div>
    </template>
    <slot></slot>
  </div>
</template>
<script>
import CustomFieldList from '../../report-preview/custom-field-list.vue';
import TextCustomField from './custom-fields/text-custom-field.vue';
import TextEditorCustomField from './custom-fields/text-editor-custom-field.vue';
import DropdownCustomField from './custom-fields/dropdown-custom-field.vue';
import ButtonGroupCustomField from './custom-fields/button-group-custom-field.vue';
import InputCustomField from './custom-fields/input-custom-field.vue';
import SelectableTextEditorCustomField from './custom-fields/selectable-text-editor-custom-field.vue';

export default {
  extends: CustomFieldList,
  components: {
    TextCustomField,
    TextEditorCustomField,
    DropdownCustomField,
    ButtonGroupCustomField,
    InputCustomField,
    SelectableTextEditorCustomField,
  },
  data() {
    return {
      selectedOptions: [],
    };
  },
  computed: {
    hideableFieldsOptions() {
      return this.fieldComponentsData.map((field) => {
        const fieldKeyPathCombination = `${field.templatePath}.${field.templateKey}`;
        return { text: field.label || fieldKeyPathCombination, value: fieldKeyPathCombination };
      });
    },
    selectedHideableFieldsOptions() {
      return this.hideableFieldsOptions
        .filter(option => this.hideableFields.includes(option.value));
    },
  },
  methods: {
    onHideableFieldsSelected(fields) {
      this.$emit('set-hideable-fields', fields.map(field => field.value));
    },
  },
};
</script>
