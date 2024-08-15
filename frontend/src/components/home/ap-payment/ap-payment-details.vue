<template>
  <div class="pts-grid-edit-modal" :class="{ 'blur-loading-row': httpRequesting }">
    <div slot="default">
      <div class="container-fluid" data-e2e-type="ap-payment-detail">
        <h5>Vendor</h5>
        <hr class="my-1"/>
        <div class="row mb-5">
          <div class="col-12 col-md-3">
            <label><strong>Vendor ID</strong></label>
            <input :value="apPayment.vendor._id" type="text" disabled class="form-control" data-e2e-type="ap-payment-vendor-id">
          </div>
          <div class="col-12 col-md-3">
            <label for="vendorName"><strong>Vendor Name</strong></label>
            <input id="vendorName" :value="vendorName" type="text" disabled class="form-control" data-e2e-type="ap-payment-vendor-name">
          </div>
          <div class="col-12 col-md-3">
            <label><strong>Vendor PT Pay/Paypal/Veem</strong></label>
            <input :value="ptOrPaypal" type="text" disabled class="form-control" data-e2e-type="ap-payment-vendor-ptpayorpaypal">
          </div>
        </div>
        <div class="row">
          <div class="col-12 col-md-3">
            <label><strong>Vendor Address</strong></label>
            <input
              :value="`${vendorAddress.line1} ${vendorAddress.line2}`"
              type="text"
              disabled
              class="form-control"
              data-e2e-type="ap-payment-vendor-address">
          </div>
          <div class="col-12 col-md-3">
            <label><strong>Vendor City</strong></label>
            <input :value="vendorAddress.city" type="text" disabled class="form-control" data-e2e-type="ap-payment-vendor-city">
          </div>
          <div class="col-12 col-md-3">
            <label><strong>Vendor State</strong></label>
            <input :value="vendorState.name" type="text" disabled class="form-control" data-e2e-type="ap-payment-vendor-state">
          </div>
        </div>
        <div class="row">
          <div class="col-12 col-md-3">
            <label><strong>Vendor ZIP</strong></label>
            <input :value="vendorAddress.zip" type="text" disabled class="form-control" data-e2e-type="ap-payment-vendor-zip">
          </div>
          <div class="col-12 col-md-3">
            <label><strong>Vendor Country</strong></label>
            <input :value="vendorCountry.name" type="text" disabled class="form-control" data-e2e-type="ap-payment-vendor-country">
          </div>
        </div>
        <si-connector-details v-model="apPayment.siConnector" />
        <h5>Payment</h5>
        <hr class="my-1"/>
        <div class="row">
          <div class="col-12 col-md-3">
            <label><strong>AP Payment ID</strong></label>
            <input :value="apPayment._id" type="text" disabled class="form-control" data-e2e-type="ap-payment-id">
          </div>
          <div class="col-12 col-md-3">
            <label><strong>Status</strong></label>
            <input
              :value="status"
              type="text"
              disabled
              class="form-control"
              data-e2e-type="ap-payment-status">
          </div>
          <div class="col-12 col-md-3 mb-3" >
            <label class="d-block">Attachments</label>
            <attachments-modal
              v-model="apPayment.attachments"
              :service="_service()"
              :entity-id="entityId"
              :can-update="canUpdateOrDownloadFiles"
              :can-download="canUpdateOrDownloadFiles"
            data-e2e-type="payment-attachments"/>
          </div>
        </div>
        <div class="row">
          <div class="col-12 col-md-3" :class="{'has-danger': !isValidPaymentDate && canCreate }">
            <label><span class="pts-required-field" v-if="canCreate">*</span><strong> Payment Date</strong></label>
              <utc-flatpickr
                v-if="canCreate"
                :value="localPaymentDate"
                :config="datepickerOptions"
                @input="onPaymentDateChange($event)"
                class="form-control"
                :class="{'form-control-danger': !isValidPaymentDate}"/>
            <input v-else :value="localPaymentDate" type="text" disabled class="form-control" data-e2e-type="ap-payment-date">
          </div>
          <div class="col-12 col-md-3">
            <label for="paymentMethod"><span class="pts-required-field" v-if="canCreate">*</span><strong>Payment Method</strong></label>
            <div v-if="canCreate" :class="{'has-danger': !isValidPaymentMethod}">
              <payment-method-selector
                id="paymentMethod"
                :disabled="!canCreate"
                :data-e2e-type="'payment-method-select'"
                v-model="selectedPaymentMethod"
                placeholder="Payment method"
                title="Payment's method list">
              </payment-method-selector>
            </div>
            <input id="paymentMethod" v-else :value="paymentMethod" type="text" disabled class="form-control" data-e2e-type="ap-payment-method">
          </div>
          <div class="col-12 col-md-3" :class="{'has-danger': !isValidBankAccount && canCreate }">
            <label for="bankAccount"><span class="pts-required-field" v-if="canCreate">*</span><strong>Bank Account</strong></label>
            <simple-basic-select
              v-if="canCreate"
              id="bankAccount"
              v-model="apPayment.bankAccount"
              :options="bankAccounts"
              :format-option="({ _id, name }) => ({ text: name, value: _id })"
              :filter-option="({ deleted }) => !deleted"
              :disabled="!canCreate"
              data-e2e-type="bank-account-select" />
            <input v-else id="bankAccount" :value="bankAccount" type="text" disabled class="form-control" data-e2e-type="ap-payment-bank-account">
          </div>
        </div>
        <div class="row mb-5">
          <div class="col-12 col-md-3">
            <label><strong>Total Payment Amount</strong></label>
            <input
              :value="totalPaymentAmount | currency('$', 2)"
              type="text"
              disabled
              class="form-control"
              data-e2e-type="ap-payment-total-amount">
          </div>
          <div class="col-12 col-md-3">
            <label><strong>Total Applied Credit</strong></label>
            <input
              :value="totalCreditsApplied | currency('$', 2)"
              type="text"
              disabled
              class="form-control"
              data-e2e-type="ap-payment-total-applied-credit">
          </div>
        </div>
        <table
          class="table table-sm pts-data-table table-stacked table-bordered table-hover table-striped"
          data-e2e-type="ap-payment-table"
        >
          <thead class="hidden-xs-down">
          <tr role="row">
            <th ref="th" v-for="col in tableColumns" :key="col.name">
              <span>{{ col.name }}</span>
            </th>
          </tr>
          </thead>
          <tbody data-e2e-type="request-files-container">
          <tr v-for="details in apPayment.details" :key="details.billNo" role="row">
            <td v-for="col in tableColumns" :key="col.name">
              <template v-if="col.type === 'currency'">
                {{ colValue(col, details) | currency('$', 2) }}
              </template>
              <template v-else>
                {{ colValue(col, details) }}
              </template>
            </td>
          </tr>
          </tbody>
        </table>
        <div v-if="canViewMockedSIPayload" class="row mt-4">
        <div class="col-12 px-4">
          <h5>Payment Reverse SI payload</h5>
          <hr class="my-1 mb-2"/>
          <textarea
            rows="30"
            class="form-control payload-area"
            data-e2e-type="mocked-payment-reverse-si-payload"
            readonly
            v-model="mockedPaymentReverseSIPayload"
          ></textarea>
        </div>
      </div>
      </div>
    </div>
    <div slot="modal-footer" class="form-actions mt-5 pl-4">
      <button
        data-e2e-type="bill-save"
        class="btn btn-primary pull-right ml-2"
        :disabled="!isValid"
        @click="save"
        v-if="canCreate">Save</button>
      <button data-e2e-type="bill-close-button" class="btn btn-secondary pull-right" @click="$emit('section-navigate-previous')">
        Close
      </button>
      <button data-e2e-type="populate-payment-reverse-si-payload" class="btn btn-info pull-right mr-2" type="button" v-if="mock" @click="getPaymentReverseSIPayload">
        Populate payment reverse SI Payload
      </button>
      <void-modal
        data-e2e-type="ap-payment-void"
        v-if="canVoid && apPayment.siConnector.isSynced"
        :title="'Void Payment Date'"
        :details="voidDetails"
        class="pull-right ml-2"
        @submit="voidApPayment"
      />
    </div>
  </div>
</template>

<style lang="scss" src="./ap-payment-details.scss" scoped></style>
<script src="./ap-payment-details.js"></script>
