<template>
  <div class="pts-grid-edit-modal" data-e2e-type="quote-container" :class="{'blur-loading-row': loading }">
    <report-preview
      :template="reportTemplate"
      :template-data="templateData"
      :footer-template="footerTemplate"
      :template-custom-field-types="availableCustomFieldTypes"
      :template-preview-custom-field-types="allCustomFieldTypes"
      :email-custom-field-types="availableEmailCustomFieldTypes"
      :template-custom-field-values.sync="dbTemplate.customFields"
      :email-custom-field-values.sync="dbEmailTemplate.emailCustomFields"
      :need-save-template-custom-fields.sync="isSaveQuoteCustomFieldChangesChecked"
      :need-save-email-custom-fields.sync="isSaveEmailCustomFieldChangesChecked"
      :allow-saving-custom-fields-to-template="!dbTemplate.hideCustomSaveToTemplate"
      :hidden-fields="dbTemplate.hiddenFields"
      :hideable-fields="dbTemplate.hideableFields"
      @set-hidden-fields="setHiddenFields($event)"
      template-custom-fields-label="Quote Template Custom Fields"
      email-custom-fields-label="Quote Email Custom Fields"
      @are-valid-template-custom-fields="setValidTemplateCustomFields"
      @are-valid-email-custom-fields="setValidEmailCustomFields"
      template-block-id="quote"
      :not-available-preview-description="notAvailablePreviewDescription"
      :is-preview-available="isPreviewAvailable"
      ref="report-preview"
      data-e2e-type="quote-report-preview-body"
      @preview-is-shown="isShown => updatePreviewVisibility(isShown)"
    >
      <template v-if="canSelectTemplates" slot="template-selectors">
        <div class="col-12">
          <label class="mb-1">
            <span class="pts-required-field">*</span>
            Quote template
          </label>
          <simple-basic-select
            data-e2e-type="quote-template-select"
            v-model="selectedQuoteTemplate"
            class="non-focusable"
            :class="{ 'has-danger': selectedQuoteTemplate === '' }"
            :options="quoteTemplateOptions"
            :format-option="({ name, _id }) => ({ text: name, value: _id })"
            placeholder="Quote template"
          />
        </div>
        <div class="col-12 mt-3">
          <label class="mb-1">
            <span class="pts-required-field">*</span>
            Email template
          </label>
          <simple-basic-select
            data-e2e-type="email-template-select"
            v-model="selectedEmailTemplate"
            class="non-focusable"
            :disabled="!canSelectTemplates"
            :class="{ 'has-danger': selectedEmailTemplate === '' }"
            :format-option="({ name, _id }) => ({ text: name, value: _id })"
            :options="emailTemplateOptions"
            placeholder="Email template"
          />
        </div>
      </template>
      <template v-if="request.serviceDeliveryTypeRequired && canEditServiceAndDeliveryType" slot="service-delivery-type-selectors">
        <div class="col-12">
          <label class="mb-1">
            <span class="pts-required-field">*</span>
            Service Type
          </label>
          <service-type-ajax-basic-select
            data-e2e-type="service-type-select"
            :empty-option="{ text: '', value: null }"
            :class="{ 'has-danger': selectedServiceType === null }"
            :is-disabled="isQuoteApproved"
            placeholder="Service type"
            v-model="selectedServiceType"
          />
        </div>
        <div class="col-12 mt-3">
          <label class="mb-1">
            <span class="pts-required-field">*</span>
            Delivery Type
          </label>
          <delivery-type-ajax-basic-select
            data-e2e-type="delivery-type-select"
            :empty-option="{ text: '', value: null }"
            :class="{ 'has-danger': selectedDeliveryType === null }"
            :is-disabled="isQuoteApproved"
            :selected-service-type="selectedServiceType"
            placeholder="Delivery type"
            v-model="selectedDeliveryType"
          />
        </div>
      </template>
      <template slot="document-form-actions">
        <button
          v-if="request._id && canExport && isPreviewShown"
          :disabled="!this.isValid"
          data-e2e-type="quote-export-button"
          class="btn btn-new-optional mr-2"
          @click="downloadPdf"
        >
          <i v-show="isExportingPdf" class="fas fa-spinner fa-pulse fa-fw"></i>
          Print PDF
        </button>
        <div class="csv-export-container">
          <button
            v-if="canExportCsv"
            :disabled="!this.isValid"
            data-e2e-type="quote-export-csv-button"
            class="btn btn-new-optional mr-2"
            @click="downloadCsv"
          >CSV</button>
        <div data-e2e-type="quote-export-csv-tooltip" class="tooltip">Export to CSV</div>
        </div>
        
        <button
          class="btn btn-new-optional pull-right"
          v-if="!userIsContact"
          :disabled="!isValid || !canSendQuote"
          data-e2e-type="quote-send-quote-button"
          @click="sendQuote"
        >
          Send Quote
          <i v-show="isSendingQuote" class="fas fa-spinner fa-pulse fa-fw"></i>
        </button>
      </template>
      <template slot="page-form-actions">
        <button
          @click.prevent="cancelHandler"
          class="btn btn-new-default mr-2"
          data-e2e-type="quote-cancel-button"
        >
          Cancel
        </button>
        <button
          v-if="canEdit"
          data-e2e-type="quote-save-button"
          :disabled="!isValid"
          class="btn pull-right mr-2"
          :class="!canApproveQuote || isQuoteApproved ? 'btn-new-primary' : 'btn-new-optional'"
          @click="onSaveClick"
        >
          Save
        </button>
        <button
          class="btn btn-new-primary"
          :class="{ 'approve-quote-disabled': !areMandatoryFieldsFilled }"
          v-if="canApproveQuote && !isQuoteApproved"
          :disabled="!areMandatoryFieldsFilled"
          data-e2e-type="quote-approve-button"
          @click="onQuoteApprove"
        >
          Approve Quote
        </button>
      </template>
    </report-preview>
    <approve-quote
      :canEditQuote="userIsContact"
      :request="request"
      v-model="showApproveQuoteModal"
      :track-submit="trackSubmit"
    />
  </div>
</template>
<script src="./request-quote.js"></script>
<style src="../ip-quote/pdf-shared.scss" lang="scss"></style>
<style lang="scss" src="./request-quote.scss"></style>
<style lang="scss" src="./request-quote-custom.scss"></style>
