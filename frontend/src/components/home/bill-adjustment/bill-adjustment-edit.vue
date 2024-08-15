<template>
  <div class="pts-grid-edit-modal drop-zone-trigger position-relative">
    <div>
      <div slot="default"
        data-e2e-type="bill-adjustment-edit-body"
        :class="{'blur-loading-row': isLoading}">
        <div id="billAdjustmentEntityForm" class="container-fluid" :class="{'pts-non-editable-form': !canCreate}">
          <div class="row form-section">
            <div class="col-12 col-md-6">
              <div class="row align-items-center" v-if="canCreate">
                <label class="col-12 col-md-4 form-check-label">
                  Adjustment Type<span class="pts-required-field"> *</span>
                </label>
                <div class="col-12 col-md-8">
                  <simple-basic-select
                    v-if="canCreate"
                    v-model="billAdjustment.type"
                    :options="billAdjustmentTypeOptions"
                    title="Adjustment Type"
                    data-e2e-type="bill-adjustment-type-select"
                    @change="onAdjustmentTypeChange"
                  />
                </div>
              </div>
              <div class="row align-items-center" :class="{ 'has-danger': errors.has('vendorName') }">
                <label class="col-md-4 col-12 form-check-label">
                  Vendor Name<span class="pts-required-field"> *</span></label>
                <div class="col-md-8 col-12">
                  <user-ajax-basic-select
                    placeholder="Choose Vendor"
                    data-e2e-type="bill-adjustment-vendor-select"
                    name="vendorName"
                    :selected-option="selectedVendor"
                    :key="providerFilterKey"
                    :fetch-on-created="false"
                    tabindex="1"
                    title="Vendor name"
                    :filter="vendorFilter"
                    @select="onVendorSelect" />
                  <span class="form-control-feedback" v-show="errors.has('vendorName')">{{ errors.first('vendorName') }}</span>
                </div>
              </div>
              <div class="row align-items-center" v-if="canCreate">
                <label class="col-12 col-md-4 form-check-label">
                  Reference Bill Number
                </label>
                <div class="col-12 col-md-8">
                  <bill-ajax-select
                    v-model="referenceBill"
                    placeholder="Reference Bill Number"
                    title="Reference Bill Number"
                    data-e2e-type="reference-bill-number-select"
                    :isDisabled="!canCreate"
                    :fetch-on-created="false"
                    :filter="billFilter"
                  />
                </div>
              </div>
              <div class="row align-items-center">
                <label class="col-md-4 col-12 form-check-label">
                  Description
                </label>
                <div class="col-md-8 col-12">
                  <input
                    type="text"
                    data-e2e-type="bill-adjustment-description-input"
                    v-model.trim="billAdjustment.description"
                    class="form-control"
                    name="description">
                </div>
              </div>
            </div>

            <div class="col-12 col-md-6">
              <div class="row align-items-center" v-if="canCreate">
                <label class="col-12 col-md-4 form-check-label">
                  Adjustment Date<span class="pts-required-field"> *</span>
                </label>
                <div class="col-12 col-md-8" :class="{'has-danger': !isValidAdjustmentDate}">
                  <div class="input-group">
                    <utc-flatpickr
                      data-e2e-type="bill-adjustment-date-input"
                      v-model="billAdjustment.date"
                      :config="datepickerOptions"
                      format="YYYY-MM-DD"
                      class="form-control provider-task-flatpick"/>
                    <span class="input-group-addon"><i class="fas fa-calendar"></i></span>
                  </div>
                  <span
                    v-show="!isValidAdjustmentDate"
                    class="form-control-feedback"
                    data-e2e-type="bill-adjustment-date-error-message">Adjustment Date cannot be in the past</span>
                </div>
              </div>
              <div class="row align-items-center" v-if="canCreate">
                <label class="col-12 col-md-4 form-check-label">
                  GL Posting Date<span class="pts-required-field"> *</span>
                </label>
                <div class="col-12 col-md-8" :class="{'has-danger': !isValidGLPostingDate}">
                  <div class="input-group">
                    <utc-flatpickr
                      data-e2e-type="bill-adjustment-gl-posting-date-input"
                      v-model="billAdjustment.glPostingDate"
                      :config="datepickerOptions"
                      format="YYYY-MM-DD"
                      class="form-control provider-task-flatpick"/>
                    <span class="input-group-addon"><i class="fas fa-calendar"></i></span>
                  </div>
                  <span
                    v-show="!isValidGLPostingDate"
                    class="form-control-feedback"
                    data-e2e-type="bill-adjustment-gl-posting-date-error-message">GL Posting Date cannot be in the past</span>
                </div>
              </div>

              <div class="row align-items-center">
                <label class="col-12 col-md-4 form-check-label">Amount</label>
                <div class="col-12 col-md-8">
                  <currency-input
                    disabled
                    v-model="billAdjustment.adjustmentTotal"
                    aria-label="Bill Adjustment estimated value"
                    :class="moneyInputClass"
                    :precision="2"
                    data-e2e-type="bill-adjustment-estimated-value-input">
                  </currency-input>
                </div>
              </div>
            </div>
          </div>
          <div class="row">
            <line-items-table
              data-e2e-type="bill-adjustment-entries"
              :lineItems="billAdjustment.lineItems"
              @gl-accounts-retrieved="saveGlAccounts"
              @on-edit-amount="onEditLineItemAmount"
              @on-edit-memo="onEditLineItemMemo"
              @on-edit-gl-account-no="onEditLineItemGlAccount"
              @on-edit-department="onEditDepartment"
              @on-line-item-add="onLineItemAdd"
              @on-line-item-remove="onLineItemRemove" />
          </div>
        </div>
      </div>
      <div slot="modal-footer" class="form-actions mt-3">
        <button class="btn btn-secondary pull-right" data-e2e-type="bill-adjustment-close-button" id="close" v-show="!saving" @click="close">Close</button>
        <button class="btn btn-primary pull-right mr-2" data-e2e-type="bill-adjustment-save-button"
          :disabled="!isValid"
          @click="save"
          v-show="!saving"
          v-if="canCreate">Save
        </button>
        <span class="pull-right saving-spinner" v-show="saving"><i class="fas fa-spinner fa-pulse fa-fw"></i></span>
      </div>
      <confirm-dialog
        data-e2e-type="adjust-bill-confirmation-dialog"
        ref="adjustBillConfirmationDialogue"
        :container-class="'small-dialog'"
        :confirmation-title="'AP ADJUSTMENT CONFIRMATION'"
        :confirmation-message="'You are about to adjust the selected AP bills. Would you like to continue?'"
        @confirm="onAdjustBillConfirmation">
      </confirm-dialog>
    </div>
  </div>
</template>

<script src="./bill-adjustment-edit.js"></script>
<style lang="scss" src="./bill-adjustment-edit.scss" scoped></style>
