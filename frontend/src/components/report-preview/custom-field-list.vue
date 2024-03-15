<template>
  <div v-if="fieldComponentsData.length > 0" class="row mt-3">
    <div class="col-12">
      <div class="row align-items-center">
        <div class="col-11 template-custom-fields-label-section">
          <div class="template-custom-field-label">{{ label }}</div>
          <div v-if="shouldShowSaveChangesButton" class="template-custom-fields-save-changes">
            <label>
              <input
                v-model="needSaveSync"
                class="align-middle pts-clickable"
                type="checkbox"
                data-e2e-type="custom-fields-save"
              >
              <span data-e2e-type="custom-fields-save-label" class="form-check-label align-middle pl-0">Save Changes to Template</span>
            </label>
          </div>
        </div>
        <div class="col-1 pl-0 text-right">
          <button
            @click="toggleList"
            type="button"
            class="collapse-icon"
            data-e2e-type="custom-fields-toggle"
          >
            <svg v-show="this.opened" width="12" height="7" viewBox="0 0 12 7" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M6.0003 0.049993C6.13364 0.049993 6.25864 0.070993 6.3753 0.112993C6.49197 0.154326 6.6003 0.224993 6.7003 0.324993L11.3253 4.94999C11.5086 5.13333 11.596 5.36266 11.5873 5.63799C11.5793 5.91266 11.4836 6.14166 11.3003 6.32499C11.117 6.50833 10.8836 6.59999 10.6003 6.59999C10.317 6.59999 10.0836 6.50833 9.9003 6.32499L6.0003 2.42499L2.0753 6.34999C1.89197 6.53333 1.66264 6.62099 1.3873 6.61299C1.11264 6.60433 0.883638 6.50833 0.700305 6.32499C0.516972 6.14166 0.425304 5.90833 0.425304 5.62499C0.425304 5.34166 0.516972 5.10833 0.700305 4.92499L5.3003 0.324993C5.4003 0.224993 5.50864 0.154326 5.6253 0.112993C5.74197 0.0709929 5.86697 0.049993 6.0003 0.049993Z" fill="#6A6C6F"/>
            </svg>
            <svg v-show="!this.opened" width="12" height="7" viewBox="0 0 12 7" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M5.9997 6.94998C5.86636 6.94998 5.74136 6.92898 5.6247 6.88698C5.50803 6.84564 5.3997 6.77498 5.2997 6.67498L0.674696 2.04998C0.491363 1.86664 0.40403 1.63731 0.412696 1.36198C0.420696 1.08731 0.516363 0.85831 0.699696 0.674976C0.883029 0.491643 1.11636 0.399976 1.3997 0.399976C1.68303 0.399976 1.91636 0.491643 2.0997 0.674976L5.9997 4.57498L9.9247 0.649976C10.108 0.466643 10.3374 0.378976 10.6127 0.386976C10.8874 0.395643 11.1164 0.491643 11.2997 0.674976C11.483 0.85831 11.5747 1.09164 11.5747 1.37498C11.5747 1.65831 11.483 1.89164 11.2997 2.07498L6.6997 6.67498C6.5997 6.77498 6.49136 6.84564 6.3747 6.88698C6.25803 6.92898 6.13303 6.94998 5.9997 6.94998Z" fill="#6A6C6F"/>
            </svg>
          </button>
        </div>
        <div class="col-12 mt-1">
          <hr class="template-custom-field-line my-1">
        </div>
      </div>
    </div>
    <transition name="fade">
      <div v-show="opened" class="col-12">
        <div class="row align-items-center p-0" data-e2e-type="custom-fields-list-container">
          <div
            v-for="fieldComponentData in fieldComponentsData"
            :key="fieldComponentData.templateKey"
            :class="fieldComponentData.columnSize || 'col-12'"
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
              :can-hide-field="canHideField(fieldComponentData.templatePath, fieldComponentData.templateKey)"
              :is-hidden="isFieldHidden(fieldComponentData.templatePath, fieldComponentData.templateKey)"
              :read-only="fieldComponentData.readOnly"
              :subtitle="fieldComponentData.subtitle"
              @toggle-is-hidden="toggleIsFieldHidden(fieldComponentData.templatePath, fieldComponentData.templateKey)"
              @is-valid-custom-field="setValidCustomField($event, fieldComponentData.templateKey)"
              :data-e2e-cf-type="`custom-field-component-${fieldComponentData.templatePath}`"
              :data-e2e-cf-key="fieldComponentData.templateKey"
            >
            </component>
          </div>
        </div>
      </div>
    </transition>
  </div>
</template>
<script src="./custom-field-list.js"></script>
<style lang="scss" src="./custom-field-list.scss"></style>
