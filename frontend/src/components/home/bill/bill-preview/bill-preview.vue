<template>
  <div
    class="pts-grid-edit-modal bill-inline-edit"
    data-e2e-type="bill-preview-container"
  >
    <div slot="default">
      <report-preview
        :template="frame"
        ref="report-preview"
        :footer-template="footerTemplate"
        data-e2e-type="bill-report-preview-body"
      >
        <template slot="template-selectors" v-if="canSelectTemplates">
          <div class="col-12">
            <label class="mb-1">
              <span class="pts-required-field">*</span>
              Bill Template
            </label>
            <simple-basic-select
              data-e2e-type="bill-template-select"
              v-model="selectedBillTemplate"
              class="non-focusable"
              :class="{ 'has-danger': selectedBillTemplate === '' }"
              :options="billTemplateOptions"
              :format-option="({ name, _id }) => ({ text: name, value: _id })"
              @select="preview"
              :disabled="shouldDisableTemplateSelect"
              placeholder="Bill template"
            />
          </div>
        </template>
        <template slot="document-form-actions">
          <button
            class="btn btn-new-primary pull-right mr-2"
            data-e2e-type="bill-export-pdf-button"
            id="print"
            @click="downloadPdf"
          >
            <i
              v-show="isDownloadingPdf"
              class="fas fa-spinner fa-pulse fa-fw"
            ></i>
            Print PDF
          </button>
        </template>
        <template slot="page-form-actions">
          <button
            class="btn btn-new-default pull-right mr-2"
            data-e2e-type="close-button"
            @click="cancel"
          >
            Cancel
          </button>
        </template>
      </report-preview>
    </div>
  </div>
</template>
<script src="./bill-preview.js"></script>
<style lang="scss" src="./bill-preview.scss"></style>
