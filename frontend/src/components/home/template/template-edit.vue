<template>
  <div class="pts-grid-edit-modal" data-e2e-type="template-edit" :class="{'blur-loading-row': httpRequesting}">
    <div slot="default" data-e2e-type="template-edit-body">
      <div class="container-fluid">
        <div class="row align-items-center">
          <div class="col-12 col-md-2">
            <label for="name">
              <span class="pts-required-field">*</span> Name
            </label>
          </div>
          <div
            class="col-12 col-md-10"
            data-e2e-type="template-name-container"
            :class="{ 'has-danger': template.name === '' || errors.has('name') }"
          >
            <input type="text"
              class="form-control"
              data-e2e-type="template-name"
              v-validate="'required'"
              id="name"
              name="name"
              autofocus
              :disabled="!canEdit"
              v-model.trim="template.name"
            />
          </div>
        </div>
        <div class="row align-items-center">
          <div class="col-12 col-md-2">
            <label for="name" data-e2e-type="type"><span class="pts-required-field">*</span> Type</label>
          </div>
          <div class="col-12 col-md-10" :class="{ 'has-danger': selectedType.value === '' }">
            <basic-select
              data-e2e-type="template-type"
              :options="typeOptions"
              :selected-option="selectedType"
              @select="onTypeSelect"
            />
          </div>
        </div>
        <div class="row align-items-center">
          <div class="col-12 col-md-2">
            <label for="name" data-e2e-type="template-logo-label">Template Logo</label>
          </div>
          <div class="col-12 col-md-10">
            <template-logo-ajax-select
              data-e2e-type="template-logo-ajax-select"
              :value="selectedLogoOption"
              @logo-name-selected="onLogoNameSelected"
            />
          </div>
        </div>
        <div class="row align-items-center">
          <div class="col-12 col-md-2">
            <label>Template Footer</label>
          </div>
          <div class="col-12 col-md-10">
            <footer-template-ajax-basic-select
              data-e2e-type="footer-template-dropdown"
              :empty-option="{ text: '', value: null }"
              :is-disabled="!canEdit"
              :options="footerTemplateOptions"
              placeholder="Select Template Footer"
              v-model="template.footerTemplate"
            />
          </div>
        </div>
        <div class="row align-items-center" v-if="template.footerTemplate">
          <div class="col-12 col-md-2"></div>
          <div class="col-12 col-md-10">
            <input type="text"
              class="form-control"
              data-e2e-type="footer-template-description"
              v-validate="'required'"
              disabled
              :value="selectedFooterTemplate"
            />
          </div>
        </div>
        <div class="row align-items-center checkbox-container mt-3 mb-3" v-show="!isNew && canEdit">
          <div class="col-11 col-md-2">
            <label>Inactive</label>
          </div>
          <div class="col-1 col-md-1">
            <input
              type="checkbox"
              data-e2e-type="template-inactive-checkbox"
              class="form-control pts-clickable"
              v-model="template.deleted"
            >
          </div>
        </div>
        <div class="row align-items-center" data-e2e-type="template-editor">
          <div class="col-12">
            <label>Template</label>
            <rich-text-editor
              data-e2e-type="rich-text-editor"
              :disabled="!canEdit"
              v-model.trim="template.template"
              placeholder="Template"
              :options="richTextEditorOptions"
              @template-sanitizing="onTemplateSanitizing"
              @template-error="onTemplateError($event)"
            />
          </div>
        </div>
        <template-custom-field-list
          :label="customFieldData.label"
          :custom-field-types="customFieldData.types"
          :custom-field-values.sync="customFieldValues"
          :should-show-save-changes-button="false"
          :hidden-fields="template.hiddenFields"
          :hideable-fields="template.hideableFields"
          @set-hidden-fields="setHiddenFields($event)"
          @set-hideable-fields="setHideableFields($event)"
          @are-valid-custom-fields="setValidCustomFields"
          data-e2e-type="custom-fields"
        >
          <div v-if="isTemplateInvoiceType" class="col-12 mt-3">
            <div class="row align-items-center">
              <div class="col-3">
                <label>Group Task Items per Workflow</label>
              </div>
              <div class="col-1">
                <input
                  type="checkbox"
                  data-e2e-type="template-group-task-items-per-workflow"
                  class="pts-clickable"
                  v-model="template.groupTaskItemsPerWorkflow"
                >
              </div>
            </div>
          </div>
          <div v-if="isTemplateQuoteType" class="col-12 mt-3">
            <div class="row align-items-center">
              <div class="col-3">
                <label>
                  Disable saving custom fields to template in quote details view ("Save Changes to Template" checkbox)
                </label>
              </div>
              <div class="col-1">
                <input
                  type="checkbox"
                  data-e2e-type="disable-save-custom-fields-to-template-checkbox"
                  class="pts-clickable"
                  v-model="template.hideCustomSaveToTemplate"
                >
              </div>
            </div>
          </div>
        </template-custom-field-list>
        <div class="row align-items-center mt-2">
          <div class="col" data-e2e-type="template-variables">
            <h6>Available variables</h6>
            <variables-reference :vars="template.variables" />
          </div>
        </div>
      </div>
    </div>
    <div slot="modal-footer" class="form-actions">
      <button
        class="btn btn-secondary pull-right"
        data-e2e-type="template-close"
        @click="close"
      >{{ cancelText }}</button>
      <button
        v-if="canEdit"
        class="btn btn-primary pull-right mr-2"
        :class="{'blur-loading-row': loading}"
        :disabled="sanitizingTemplate || !isValid"
        @click="save"
        data-e2e-type="template-save-button"
      >Save</button>
      <button
        v-if="canEdit"
        class="btn btn-primary pull-right mr-2"
        :class="{'blur-loading-row': loading}"
        :disabled="sanitizingTemplate || loading"
        @click="copyTemplate"
        data-e2e-type="template-copy-button"
      >Copy</button>
      <button
        v-if="canEdit && hasTemplateInClipboard"
        class="btn btn-primary pull-right mr-2"
        :class="{'blur-loading-row': loading}"
        :disabled="sanitizingTemplate || loading"
        @click="pasteTemplate"
        data-e2e-type="template-paste-button"
      >Paste</button>
    </div>
  </div>
</template>
<script src="./template-edit.js"></script>
