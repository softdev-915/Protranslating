<template>
  <div
    class="pts-grid-edit-modal"
    data-e2e-type="advance-edit"
    :class="{ 'blur-loading-row': httpRequesting }"
  >
    <div slot="default" data-e2e-type="advance-edit-body">
      <div class="container-fluid">
        <h6 class="d-inline-block mr-4">Payment Options</h6>
        <hr class="my-1" />
        <div class="row p-0 my-4">
          <div class="col-12 col-md-3">
            <label class="d-block required">Payment Method</label>
            <payment-method-select
              v-if="isNew || canEdit"
              v-model="advance.paymentMethod"
              :format-option="paymentMethodFormatter"
              :isError="!isValidPaymentMethod"
              data-e2e-type="advance-payment-method-select"
            />
            <input
              v-else
              disabled
              type="text"
              class="form-control"
              :value="advance.paymentMethod.name"
              data-e2e-type="advance-payment-method-read-only"
            >
          </div>
          <div class="col-12 col-md-3">
            <label class="d-block required">Company</label>
            <company-select
              v-if="canEdit"
              :selected-option="selectedCompany"
              @select="onCompanySelected"
              data-e2e-type="advance-company-select"
            />
            <input
              v-else
              disabled
              type="text"
              class="form-control"
              :value="advance.company.hierarchy"
              data-e2e-type="advance-company-read-only"
            >
          </div>
          <div class="col-12 col-md-3 mb-2 radio-btns-wrapper" v-if="canReadAll && canEdit">
            <label class="d-block required">Account type</label>
            <div class="d-flex align-items-center">
              <input
                type="radio"
                v-model="accountType"
                class="form-control"
                value="Bank Account"
                data-e2e-type="advance-account-type-bank-account"
                :disabled="!isEnabledAccountType"
              >
              <label class="mb-0 ml-1">Bank Account</label>
            </div>
            <div class="d-flex align-items-center">
              <input
                type="radio"
                v-model="accountType"
                class="form-control"
                value="Undeposited Funds Account Identifier"
                data-e2e-type="advance-account-type-undeposited-funds"
                :disabled="!isEnabledAccountType"
              >
              <label class="mb-0 ml-1">Undeposited Funds Account Identifier</label>
            </div>
          </div>
          <div class="col-12 col-md-3" v-if="canReadAll">
            <label class="d-block required" data-e2e-type="advance-bank-account-select-label">{{ accountType }}</label>
            <bank-account-select
              v-if="canEdit && !advance.shouldGoOnUndepositedAccount"
              v-model="selectedBank"
              @select="onOptionSelect"
              :fetch-on-created="false"
              data-e2e-type="advance-bank-account-select"
            />
            <input
              v-else
              disabled
              type="text"
              class="form-control"
              :value="bankAccount"
              data-e2e-type="advance-bank-account-read-only"
            >
          </div>
          <div class="col-12 col-md-3">
            <label class="d-block required">Currency</label>
            <currency-select
              v-if="canEdit && !advance.shouldGoOnUndepositedAccount"
              v-model="advance.accounting.currency"
              :currenciesAvailable="currencies"
              :fetch-on-created="false"
              :is-disabled="!isNew"
              :format-option="currencyFormatter"
              data-e2e-type="advance-currency-select"
            />
            <input
              v-else
              disabled
              type="text"
              class="form-control"
              :value="advance.accounting.currency.isoCode"
              data-e2e-type="advance-currency-read-only"
            >
          </div>
        </div>
        <si-connector-details v-if="!isNew" v-model="advance.siConnector" />
        <h6 class="d-inline-block mr-4">Payment Details</h6>
        <hr class="my-1" />
        <div class="row p-0 my-4">
          <div class="col-12 col-md-3">
            <label class="d-block">ID</label>
            <input
              type="text"
              class="form-control"
              disabled
              :value="advance._id"
              data-e2e-type="advance-id-read-only"
            >
          </div>
          <div class="col-12 col-md-3">
            <label class="d-block">Advance Number</label>
            <input
              type="text"
              class="form-control"
              disabled
              :value="advance.no"
              data-e2e-type="advance-number-read-only"
            >
          </div>
          <div class="col-12 col-md-3">
            <label class="d-block">Status</label>
            <input
              type="text"
              class="form-control"
              disabled
              :value="advance.status"
              data-e2e-type="advance-status-read-only"
            >
          </div>
        </div>
        <div class="row p-0 my-4">
          <div class="col-12 col-md-3">
            <label class="d-block required">Payment Date</label>
            <utc-flatpickr
              class="form-control"
              v-model="advance.date"
              :disabled="!canEdit"
              data-e2e-type="advance-payment-date"
            />
          </div>
          <div class="col-12 col-md-3">
            <label class="d-block required">Receipt Date</label>
            <utc-flatpickr
              class="form-control"
              v-model="advance.receiptDate"
              :disabled="!canEdit"
              data-e2e-type="advance-receipt-date"
            />
          </div>
          <div class="col-12 col-md-3">
            <label class="d-block">Document Number</label>
            <input
              type="text"
              class="form-control"
              v-model="advance.docNo"
              :disabled="!canEdit"
              data-e2e-type="advance-document-number"
            >
          </div>
        </div>
        <div class="row p-0 my-4">
          <div class="col-12 col-md-6">
            <label class="d-block">Description</label>
            <input
              type="text"
              class="form-control"
              v-model="advance.description"
              :disabled="!canEdit"
              data-e2e-type="advance-description"
            >
          </div>
          <div class="col-auto" v-if="!isNew">
            <label class="d-block">Attachments</label>
            <attachments-modal
              v-model="advance.attachments"
              :service="service"
              :entity-id="entityId"
              data-e2e-type="advance-attachments"
            />
          </div>
        </div>
        <template v-if="!canEdit">
          <div class="row p-0 my-4">
            <div class="col-12 col-md-3">
              <label class="d-block">Amount Applied</label>
              <currency-input
                data-e2e-type="advance-amount-applied"
                disabled
                class="form-control"
                :currency="null"
                :precision="2"
                :value="amountApplied"
              />
            </div>
            <div class="col-12 col-md-3">
              <label class="d-block">Amount Available</label>
              <currency-input
                data-e2e-type="advance-amount-available"
                disabled
                class="form-control"
                :currency="null"
                :precision="2"
                :value="amountAvailable"
              />
            </div>
          </div>
        </template>
        <div class="row p-0 my-4">
          <div class="col-12 col-md-3">
            <label class="d-block">Amount</label>
            <currency-input
              data-e2e-type="advance-amount"
              class="form-control"
              v-model="advance.accounting.amount"
              :currency="null"
              :precision="2"
              :disabled="!canEdit"
            />
          </div>
          <div class="col-12 col-md-3" v-if="canReadAll">
            <label class="d-block">Exchange Rate</label>
            <currency-input
              data-e2e-type="advance-exchange-rate"
              disabled
              class="form-control"
              :currency="null"
              :precision="5"
              :value="exchangeRate"
            />
          </div>
          <div class="col-12 col-md-3" v-if="canReadAll">
            <label class="d-block">Local Amount</label>
            <currency-input
              data-e2e-type="advance-local-amount"
              disabled
              class="form-control"
              :currency="null"
              :precision="2"
              :value="localAmount"
            />
          </div>
        </div>
        <template v-if="!canEdit">
          <h6 class="d-inline-block mr-4">Application Details</h6>
          <hr class="my-1" />
          <div class="row p-0 my-4">
            <div class="col-12 col-md-9">
              <label class="d-block">Applied To</label>
              <input
                type="text"
                class="form-control"
                disabled
                :value="advance.appliedTo"
                data-e2e-type="advance-applied-to"
              >
            </div>
          </div>
        </template>
      </div>
    </div>
    <div slot="modal-footer" class="form-actions">
      <button
        class="btn btn-secondary pull-right mr-2"
        @click="close"
        data-e2e-type="advance-close-button"
      >
        Close
      </button>
      <void-modal
        v-if="!isNew && !isVoided && advance.siConnector.isSynced"
        :details="voidDetails"
        @submit="voidAdvance"
      />
      <button
        v-if="isNew || canEdit"
        class="btn btn-primary pull-right mr-2"
        @click="save"
        :disabled="!isValid"
        data-e2e-type="advance-save-button"
      >
        Save
      </button>
    </div>
  </div>
</template>

<script src="./ar-advance-edit.js" />
<style lang="scss" scoped src="./ar-advance-edit.scss" />
