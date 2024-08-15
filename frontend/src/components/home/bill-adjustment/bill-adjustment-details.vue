<template>
  <div class="pts-grid-edit-modal drop-zone-trigger position-relative">
    <div>
      <div slot="default"
        data-e2e-type="bill-adjustment-edit-body"
        :class="{'blur-loading-row': isLoading}">
        <div id="billAdjustmentDetailsForm" class="container-fluid pts-non-editable-form">
          <div class="row">
            <div class="col">
              <h6 class="mt-3 section-header">Vendor</h6>
              <hr>
            </div>
          </div>
          <div class="row">
            <div class="col-12 col-md-6">
              <label>
                Vendor ID
              </label>
              <div class="mt-2">
                <input
                  type="text"
                  disabled
                  data-e2e-type="bill-adjustment-vendor-id-input"
                  v-model.trim="billAdjustment.vendor._id"
                  class="form-control"
                  name="vendorId">
              </div>
            </div>
            <div class="col-12 col-md-6">
              <label>
                Vendor Name
              </label>
              <div class="mt-2">
                <input
                  type="text"
                  disabled
                  data-e2e-type="bill-adjustment-vendor-name-input"
                  v-model.trim="vendorName"
                  class="form-control"
                  name="vendorName">
              </div>
            </div>
            <div class="col-sm"></div>
            <div class="col-sm"></div>
          </div>
          <si-connector-details v-model="billAdjustment.siConnector" />
          <div class="row mt-4">
            <div class="col">
              <h6 class="mt-2 section-header">Adjustment Details</h6>
              <hr>
            </div>
          </div>
          <div class="row">
            <div class="col-12 col-sm-6 col-md-3 ">
              <label>
                Adjustment Number
              </label>
              <div class="mt-2">
                <input
                  type="text"
                  disabled
                  data-e2e-type="bill-adjustment-number-input"
                  v-model.trim="billAdjustment.adjustmentNo"
                  class="form-control"
                  name="syncError">
              </div>
            </div>
            <div class="col-12 col-sm-6 col-md-3 ">
              <label>
                Adjustment Type
              </label>
              <div class="mt-2">
                <simple-basic-select
                  v-model="billAdjustment.type"
                  :options="billAdjustmentTypeOptions"
                  title="Adjustment Type"
                  data-e2e-type="bill-adjustment-type-select"
                  :disabled="!canEditFailedSync"
                  :class="{ disabled: !canEditFailedSync}"
                />
              </div>
            </div>
            <div class="col-12 col-sm-6 col-md-3 ">
              <label>
                Reference Bill Number
              </label>
              <div class="mt-2">
                <bill-ajax-select
                  v-model="referenceBill"
                  placeholder="Reference Bill Number"
                  data-e2e-type="reference-bill-number-select"
                  title="Reference Bill Number"
                  :filter="billFilter"
                  :is-disabled="!canEditFailedSync"
                  :search-term="billSearchTerm"
                  class="form-control"
                  :fetch-on-created="canEditFailedSync"
                />
              </div>
            </div>
            <div class="col-12 col-sm-6 col-md-3 ">
              <label>
                Status
              </label>
              <div class="mt-2">
                <input
                  type="text"
                  disabled
                  data-e2e-type="bill-adjustment-status-input"
                  v-model.trim="billAdjustment.status"
                  class="form-control"
                  name="status">
              </div>
            </div>
          </div>
          <div class="row">
            <div class="col-12 col-sm-3">
              <label>
                Adjustment Date
              </label>
              <div class="mt-2">
                <div class="input-group">
                  <utc-flatpickr
                    data-e2e-type="bill-adjustment-date-input"
                    v-model="billAdjustment.date"
                    :disabled="!canEditFailedSync"
                    :config="datepickerOptions"
                    format="YYYY-MM-DD"
                    class="form-control provider-task-flatpick"/>
                  <span class="input-group-addon"><i class="fas fa-calendar"></i></span>
                </div>
              </div>
            </div>
            <div v-if="hasGlPostingDate && canReadAll" class="col-12 col-sm-3">
              <label>
                GL Posting Date
              </label>
              <div class="mt-2">
                <div class="input-group">
                  <utc-flatpickr
                    data-e2e-type="bill-adjustment-gl-posting-date-input"
                    v-model="billAdjustment.glPostingDate"
                    :disabled="!canEditFailedSync"
                    :config="datepickerOptions"
                    format="YYYY-MM-DD"
                    class="form-control provider-task-flatpick"/>
                  <span class="input-group-addon"><i class="fas fa-calendar"></i></span>
                </div>
              </div>
            </div>
            <div class="col-sm-6">
              <label>
                Description
              </label>
              <div class="mt-2">
                <input
                  type="text"
                  :disabled="!canEditFailedSync"
                  data-e2e-type="bill-adjustment-description-input"
                  v-model.trim="billAdjustment.description"
                  class="form-control"
                  name="description">
              </div>
            </div>
          </div>
          <div class="row">
            <div class="col-12 col-sm-3">
              <label>
                Adjustment Total
              </label>
              <div class="mt-2">
                <currency-input
                  disabled
                  class="form-control"
                  name="adjustmentTotal"
                  data-e2e-type="bill-adjustment-total-input"
                  :value="billAdjustment.adjustmentTotal"
                  :precision="2"/>
              </div>
            </div>
            <div class="col-12 col-sm-3">
              <label>
                Amount Paid
              </label>
              <div class="mt-2">
                <currency-input
                  disabled
                  class="form-control"
                  name="amountPaid"
                  data-e2e-type="bill-adjustment-amount-paid-input"
                  :value="billAdjustment.amountPaid"
                  :precision="2"/>
              </div>
            </div>
            <div class="col-sm-6">
              <label>
                Adjustment Balance
              </label>
              <div class="mt-2">
                <currency-input
                  disabled
                  data-e2e-type="bill-adjustment-balance-input"
                  :value="billAdjustment.adjustmentBalance"
                  :precision="2"
                  class="form-control"
                  name="adjustmentBalance" />
              </div>
            </div>
            <div class="col-sm"></div>
          </div>
          <div class="row mt-2">
            <line-items-table
              data-e2e-type="bill-adjustment-entries"
              :line-items="billAdjustment.lineItems"
              :disabled="!canEditFailedSync"
              :can-read-gl-account="canReadAll"
              :can-read-department-id="canReadAll"
              @gl-accounts-retrieved="saveGlAccounts"
              @on-edit-amount="onEditLineItemAmount"
              @on-edit-memo="onEditLineItemMemo"
              @on-edit-gl-account-no="onEditLineItemGlAccount"
              @on-edit-department="onEditDepartment"
              @on-line-item-add="onLineItemAdd"
              @on-line-item-remove="onLineItemRemove"
            />
          </div>
          <div class='row mt-4'>
            <div class="mx-3 w-100">
              <h6 class="pull-left section-header">File upload</h6>
              <div class="pull-right mb-2">
                <button
                  data-e2e-type="download-all-files"
                  v-if="hasFiles"
                  v-show="!downloadingFiles"
                  @click="triggerFilesDownload()"
                  class="mr-2 pts-clickable btn transactoin-upload-document-button"
                >
                  Download All Source Files
                  <i class="fas fa-file-archive-o"></i>
                </button>
                <span class="mr-2 saving-spinner" v-show="downloadingFiles">
                  <i class="fas fa-spinner fa-pulse fa-fw"></i>
                </span>
                <iframe-download
                  v-if="hasFiles"
                  ref="filesIframeDownload"
                  :url="billAdjustmentZipFileURL"
                  @download-finished="onSrcFilesDownloadFinished()"
                  @download-error="onIframeDownloadError($event)"
                ></iframe-download>
                <button
                  class="pts-clickable btn bill-adjustment-upload-document-button"
                  @click.prevent="fireUpload($event)"
                  data-e2e-type="bill-adjustment-upload-file"
                >
                  Add File
                  <i class="fas fa-plus"></i>
                </button>
                <input
                  id="addFile"
                  ref="fileUpload"
                  multiple
                  type="file"
                  name="files"
                  @change="onFileUpload($event)"
                  style="display: none"
                />
              </div>
              <bill-adjustment-files
                :useIframeDownload="false"
                ref="documentProspect"
                :entityId="billAdjustment._id"
                :documents="documents"
                :canEdit="canEdit"
                :canDelete="canEdit"
                :urlResolver="documentUrlResolver"
                :visibleColumns="visibleDocumentColumns"
                @document-delete="onDocumentDelete"
              />
            </div>
          </div>
          <template>
            <div class="row">
              <div class="col-12 mt-1">
                <h6 class="d-inline-block mr-4 section-header">Application Details</h6>
                <hr class="my-1" />
              </div>
            </div>
            <div class="row">
              <div class="col-12 col-md-6">
                  <label class="d-block">Applied To</label>
                  <input
                    type="text"
                    class="form-control"
                    disabled
                    :value="billAdjustment.appliedTo"
                    data-e2e-type="bill-adjustment-applied-to"
                  >
              </div>
            </div>
          </template>
        </div>
      </div>
      <div slot="modal-footer" class="form-actions mt-5 pl-4">
        <button
          class="btn btn-primary pull-right"
          :disabled="!(isValid && canEditFailedSync)"
          @click="save"
        >
          Save
        </button>
        <button class="btn btn-secondary pull-right mr-2" id="close" @click="close">Cancel</button>
      </div>
      <confirm-dialog
        data-e2e-type="adjust-bill-confirmation-dialog"
        ref="adjustBillConfirmationDialogue"
        :container-class="'small-dialog'"
        :confirmation-title="'AP ADJUSTMENT CONFIRMATION'"
        :confirmation-message="'You are about to adjust the selected AP bills. Would you like to continue?'"
        @confirm="onAdjustBillConfirmation"
      />
    </div>
  </div>
</template>

<script src="./bill-adjustment-details.js"></script>
<style lang="scss" src="./bill-adjustment-edit.scss" scoped></style>
