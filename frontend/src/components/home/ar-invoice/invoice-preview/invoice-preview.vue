<template>
  <div
    class="pts-grid-edit-modal invoice-inline-edit"
    data-e2e-type="invoice-preview-container"
    :class="{'blur-loading-row': loading}"
  >
    <div slot="default">
      <report-preview
        :template="template"
        :template-data="invoiceTemplateData"
        :footer-template="footerTemplate"
        :template-custom-field-types="availableCustomFieldTypes"
        :template-custom-field-values.sync="invoiceTemplate.customFields"
        :allow-saving-custom-fields-to-template="false"
        :allow-saving-email-custom-fields-to-template="false"
        :hidden-fields="invoiceTemplate.hiddenFields"
        :hideable-fields="invoiceTemplate.hideableFields"
        @set-hidden-fields="setHiddenFields($event)"
        template-custom-fields-label="Invoice Template Custom Fields"
        ref="report-preview"
        data-e2e-type="invoice-report-preview-body"
      >
        <template v-if="canSelectTemplates" slot="template-selectors">
          <div class="col-12">
            <label>
              <span class="pts-required-field">*</span>
              Invoice Template
            </label>
          </div>
          <div class="col-12">
            <div class="row p-0">
              <div class="col-10">
                <simple-basic-select
                  data-e2e-type="preview-invoice-template"
                  :value="selectedInvoiceTemplate"
                  :options="invoiceTemplateOptions"
                  :format-option="formatDefaultSelectOption"
                  @select="onInvoiceTemplateSelected"
                />
              </div>
              <div class="col-2">
                <button
                  data-e2e-type="invoice-preview-button"
                  class="btn btn-new-primary"
                  :disabled="!isTemplateValid"
                  @click="getTemplateData"
                >
                  Preview
                </button>
              </div>
            </div>
          </div>
        </template>
        <template slot="document-form-actions">
          <button
            class="btn btn-new-optional pull-right mr-2"
            data-e2e-type="invoice-export-pdf-button"
            id="print"
            @click="downloadPdf"
          >
            <i v-show="isDownloadingPdf" class="fas fa-spinner fa-pulse fa-fw"></i>
            Print PDF
          </button>
        </template>
        <template slot="page-form-actions">
          <button
            @click.prevent="cancel"
            data-e2e-type="invoice-cancel-button"
            class="btn btn-new-default pull-right mr-2"
          >
            Cancel
          </button>
          <button
            v-if="canEdit"
            data-e2e-type="invoice-save-button"
            :disabled="!isValid"
            class="btn btn-new-optional pull-right mr-2"
            @click="save"
          >
            Save
          </button>
          <button
            v-if="canSend"
            class="btn btn-new-primary pull-right mr-2"
            data-e2e-type="invoice-send-button"
            id="print"
            @click="sendInvoice"
          >
            <i v-show="loading" class="fas fa-spinner fa-pulse fa-fw"></i>
            Send Invoice
          </button>
          <cc-payment-modal
            v-if="!canCreate && invoice._id"
            class="pull-right mr-2"
            :amount="invoice.accounting.balance"
            :currency="invoice.accounting.currency.isoCode"
            :entity-no="invoice.no"
            :entity-status="invoice.status"
            :entity-contact-id="invoice.contact._id"
            :entity-company-hierarchy="invoice.company.hierarchy"
            :enable-new-button="true"
            data-e2e-type="invoice-preview-payment-modal"
          />
        </template>
      </report-preview>
    </div>
  </div>
</template>
<script src="./invoice-preview.js"></script>
<style lang="scss" src="./invoice-preview.scss"></style>
<style lang="scss" src="./invoice-template-custom.scss"></style>
