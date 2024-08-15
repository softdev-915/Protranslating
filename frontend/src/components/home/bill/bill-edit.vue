<template>
  <div
    class="pts-grid-edit-modal bill-edit"
    :class="{'blur-loading-row': httpRequesting}">
    <div slot="default">
      <div class="container-fluid pl-4">
        <div class="row">
          <div class="col-6 pts-font-bold">
            <div class="row align-items-center">
              <div class="col-md-2 pts-font-bold">
                Bill No.
              </div>
              <div class="col-md-6 pts-font-bold" data-e2e-type="bill-no">
                {{bill.no}}
              </div>
            </div>
          </div>
        </div>
        <div class="row">
          <div class="col-12 col-md-5 pt-2 pb-2 bill-info-section">
            <div class="pts-font-bold">Vendor Details </div>
            <div class="row align-items-center">
              <div class="col-6 pts-font-bold"> Vendor ID </div>
              <div class="col-6" data-e2e-type="bill-vendor-id">{{ vendorDetails.vendorId }}</div>
            </div>
            <div class="row align-items-center">
              <div class="col-6 pts-font-bold"> Name </div>
              <div class="col-6" data-e2e-type="bill-vendor-name">
                {{ vendorDetails.vendorName }}
              </div>
            </div>
            <div class="row align-items-center">
              <div class="col-6 pts-font-bold"> Email </div>
              <div class="col-6" data-e2e-type="bill-vendor-email">{{ vendorDetails.email }}</div>
            </div>
            <div class="row align-items-center">
              <div class="col-6 pts-font-bold"> Phone </div>
              <div class="col-6" data-e2e-type="bill-vendor-phone">
                {{ vendorDetails.phoneNumber }}
              </div>
            </div>
            <div class="row align-items-center">
              <div class="col-6 pts-font-bold"> Billing Address </div>
              <div class="col-6" data-e2e-type="bill-vendor-billing-address">
                <p> {{vendorDetails.address.line1}} </p>
                <p> {{vendorDetails.address.line2}} </p>
                <p> {{vendorDetails.address.city}} {{vendorDetails.address.state}} {{vendorDetails.address.zip}} </p>
                <p> {{vendorDetails.address.countryName}} {{vendorDetails.address.countryCode}}  </p>
              </div>
            </div>
            <div class="row align-items-center">
              <div class="col-6 pts-font-bold"> Tax ID </div>
              <div class="col-6" data-e2e-type="bill-vendor-tax-id">{{ vendorDetails.taxId }}</div>
            </div>
            <div class="row align-items-center">
              <div class="col-6 pts-font-bold"> Vendor Company </div>
              <div class="col-6" data-e2e-type="bill-vendor-company">
                {{ vendorDetails.vendorName }}
              </div>
            </div>
            <div class="row align-items-center">
              <div class="col-6 pts-font-bold"> Payment Method </div>
              <div class="col-6">
                <payment-method-selector
                  :disabled="!canEditFinancialFields"
                  id="paymentMethod"
                  data-e2e-type="bill-vendor-payment-method"
                  v-model="selectedPaymentMethod"
                  placeholder="Payment method"
                  title="Payment's method list"
                />
              </div>
            </div>
            <div class="row align-items-center">
              <div class="col-6 pts-font-bold"> Billing Terms </div>
              <div class="col-6" v-if="canEditFinancialFields" data-e2e-type="billing-term-select-container">
                <billing-term-selector
                  data-e2e-type="bill-vendor-billing-term"
                  v-model="selectedBillingTerm"
                  placeholder="Billing terms"
                  title="Billing term's list"
                />
              </div>
              <div
                v-else-if="canReadAll || canReadOwn"
                class="col-6"
                data-e2e-type="bill-vendor-billing-term-read-only"
              >
                {{ billingTermsReadOnly }}
              </div>
            </div>
          </div>
          <div class="col-12 col-md-6 pt-2 pb-2 offset-md-1 bill-info-section">
            <div class="pts-font-bold"> Bill Details </div>
            <div class="row">
              <div class="col-md-6">
                <div class="row align-items-center">
                  <div class="col-md-3 pts-font-bold"> Bill ID </div>
                  <div class="col-md-9" data-e2e-type="bill-id">{{bill._id}}</div>
                </div>
                <div class="row align-items-center">
                  <label for="status" class="col-md-3 pts-font-bold"> Status </label>
                  <div class="col-md-9">
                    <simple-basic-select
                      data-e2e-type="bill-details-status-select"
                      v-model="selectedStatus"
                      :options="statusOptions"
                      :disabled="true"
                    />
                  </div>
                </div>
                <div data-e2e-type="si-connector-details">
                  <div class="row align-items-center" v-if="canReadAll">
                    <div class="col-md-3 pts-font-bold"> Synced </div>
                    <div class="col-md-9">
                      <input
                        data-e2e-type="si-connector-synced"
                        id="synced"
                        type="checkbox"
                        :checked="bill.siConnector.isSynced"
                        :disabled="true">
                    </div>
                  </div>
                  <div class="row align-items-center" v-if="canReadAll && mock">
                    <div class="col-md-3 pts-font-bold"> Mocked </div>
                    <div class="col-md-9">
                      <input
                        data-e2e-type="bill-mocked-read-only"
                        id="mocked"
                        type="checkbox"
                        :checked="bill.siConnector.isMocked"
                        :disabled="true">
                    </div>
                  </div>
                  <div class="row align-items-center" v-if="canReadAll">
                    <div class="col-md-3 pts-font-bold"> Sync Error </div>
                    <div class="col-md-9" data-e2e-type="si-connector-error"> {{bill.siConnector.error}} </div>
                  </div>
                  <div class="row align-items-center" v-if="canReadAll">
                    <div class="col-md-6 pts-font-bold"> Last Sync Date </div>
                    <div class="col-md-6" data-e2e-type="last-synced-date-read-only"> {{formatSyncDate(bill.siConnector.connectorEndedAt)}} </div>
                  </div>
                </div>
                <div class="row">
                  <div class="col-md-6 pts-font-bold"> Total Amount </div>
                  <div class="col-md-6" data-e2e-type="bill-total-amount">
                    USD {{ bill.totalAmount.toFixed(2) }}
                  </div>
                </div>
                <div class="row align-items-center">
                  <div class="col-md-6 pts-font-bold"> Amount Paid </div>
                  <div class="col-md-6" data-e2e-type="bill-amount-paid">
                    USD {{ bill.amountPaid.toFixed(2) }}
                  </div>
                </div>
                <div class="row align-items-center">
                  <div class="col-md-6 pts-font-bold"> Balance </div>
                  <div class="col-md-6" data-e2e-type="bill-balance">
                    USD {{ (bill.totalAmount - bill.amountPaid).toFixed(2) }}
                  </div>
                </div>
              </div>
              <div class="col-md-6">
                <div class="row" v-if="canReadAll">
                  <div class="col-md-6 pts-font-bold">
                    GL Posting Date
                  </div>
                  <flat-pickr
                    v-if="!bill.siConnector.isSynced && canEditGLPostingDate"
                    data-e2e-type="bill-gl-posting-date"
                    :value="bill.glPostingDate"
                    @input="onGlPostingDateChange($event)"
                    class="form-control" />
                  <div v-else class="col-md-6" data-e2e-type="bill-gl-posting-date-read-only">
                    {{ formatDate(bill.glPostingDate) }}
                  </div>
                </div>
                <div class="row align-items-center">
                  <div class="col-md-6 pts-font-bold">
                    Bill Date
                  </div>
                  <div class="col-md-6" data-e2e-type="bill-date">{{ formatDate(bill.date) }}</div>
                </div>
                <div class="row align-items-center">
                  <div class="col-md-6 pts-font-bold">
                    Due Date
                  </div>
                  <div class="col-md-6" data-e2e-type="bill-due-date">
                    {{ formatDate(bill.dueDate) }}
                  </div>
                </div>
                <div class="row align-items-center" v-if="canReadAll">
                  <label for="1099" class="col-6 pts-font-bold"> 1099 </label>
                  <div class="col-6">
                    <input
                      id="1099"
                      type="checkbox"
                      v-model="bill.has1099EligibleForm"
                      :disabled="!canEditFinancialFields || !bill.hasTaxIdForms"
                      data-e2e-type="bill-1099-checkbox"
                    >
                  </div>
                </div>
                <div v-if="canReadAll" class="row align-items-center">
                  <label for="feeWaived" class="col-6 pts-font-bold"> WT Fee waived </label>
                  <div class="col-6">
                    <input
                      type="checkbox"
                      v-model="bill.wtFeeWaived"
                      :disabled="!canEditFinancialFields"
                      data-e2e-type="bill-wt-fee-waived-checkbox"
                    >
                  </div>
                </div>
                <div v-if="canReadPriorityPay" class="row align-items-center">
                  <label for="priorityPay" class="col-6 pts-font-bold" data-e2e-type="bill-priority-pay"> Priority Pay </label>
                  <div class="col-6">
                    <input
                      type="checkbox"
                      v-model="bill.priorityPayment"
                      :disabled="!canEditFinancialFields"
                      data-e2e-type="bill-priority-pay-checkbox"
                    >
                  </div>
                </div>
                <div v-if="canReadBillOnHold" class="row align-items-center">
                  <label for="billOnHold" class="col-6 pts-font-bold"> Bill On Hold </label>
                  <div class="col-6">
                    <input
                    id="billOnHold"
                    type="checkbox"
                    v-model="bill.billOnHold"
                    :disabled="!canEditBillOnHold || !canEditFinancialFields"
                    data-e2e-type="bill-on-hold-checkbox">
                  </div>
                </div>
              </div>
            </div>
            <div v-if="canReadAll" class="row">
              <div class="col-6 pts-font-bold">
                Bill Payment Notes
              </div>
              <div class="col-12 textarea-container">
                <textarea
                  data-e2e-type="bill-payment-notes"
                  :disabled="!canEditFinancialFields"
                  v-model.trim="bill.billPaymentNotes" />
              </div>
            </div>
          </div>
        </div>
        <div class="row">
          <service-detail-table :can-edit="canEditServiceDetails" :serviceDetails="bill.serviceDetails" data-e2e-type="bill-service-details"/>
        </div>
        <div class="row">
          <bill-adjustment-table :billNo="bill.no" data-e2e-type="bill-adjustments"/>
        </div>
        <div class="row">
          <ap-payment-table :billId="bill._id" data-e2e-type="bill-ap-payments"/>
        </div>
        <div class='w-100'>
          <div class="pts-font-bold pull-left">File upload</div>
            <div
              v-if="canUpdateOrDownloadFiles"
              class="pull-right">
              <button
                data-e2e-type="download-all-files"
                v-if="hasFiles"
                v-show="!downloadingFiles"
                @click="triggerFilesDownload()"
                class="mr-2 pts-clickable btn transactoin-upload-document-button">
                Download All Files
                <i class="fas fa-file-archive-o"></i>
              </button>
              <span class="mr-2 saving-spinner" v-show="downloadingFiles">
                <i class="fas fa-spinner fa-pulse fa-fw"></i>
              </span>
              <iframe-download
                v-if="hasFiles"
                ref="filesIframeDownload"
                :url="billZipFileURL"
                @download-finished="onSrcFilesDownloadFinished()"
                @download-error="onIframeDownloadError($event)"
              ></iframe-download>

              <button
                class="pts-clickable btn bill-upload-document-button"
                @click.prevent="fireUpload($event)"
                data-e2e-type="bill-upload-file"
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
                data-e2e-type="bill-file-input"
              />
          </div>
          <bill-files
            class="w-100"
            :useIframeDownload="false"
            ref="documentProspect"
            :entityId="bill._id"
            :documents="documents"
            :canEdit="canUpdateOrDownloadFiles"
            :canDelete="canUpdateOrDownloadFiles"
            :urlResolver="documentUrlResolver"
            :visibleColumns="billFilesColumns"
            @document-delete="onDocumentDelete"
          />
        </div>
      </div>
    </div>
    <div slot="modal-footer" class="form-actions">
      <button class="btn btn-secondary pull-right" @click="cancel">Cancel</button>
      <button
        data-e2e-type="bill-save"
        class="btn btn-primary pull-right mr-2"
        :disabled="!isValid"
        @click="save"
        v-if="canEdit"
      >Save</button>
      <button
        data-e2e-type="bill-print"
        class="btn btn-primary pull-right mr-2"
        :disabled="!isValid"
        @click="print"
        v-if="canReadOwn || canReadAll"
      >Print</button>
    </div>
  </div>
</template>

<style lang="scss" src="./bill-edit.scss" scoped></style>
<script src="./bill-edit.js"></script>
