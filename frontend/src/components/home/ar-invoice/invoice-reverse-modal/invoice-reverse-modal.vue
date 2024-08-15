<template>
  <div data-e2e-type="invoice-reverse-modal">
    <button
      class="btn btn-primary"
      :disabled="!canReverse"
      @click="show"
      data-e2e-type="reverse-btn"
    >
      Reverse
    </button>
    <b-modal
      hide-header-close
      :no-fade="true"
      ref="modal"
      class="invoice-reverse-modal"
      @close="hide"
      data-e2e-type="invoice-reverse-modal-body"
    >
      <div slot="modal-header" class="w-100">
        <h6>Transaction Reversal Date</h6>
      </div>
      <div slot="default">
        <div class="row">
          <div class="col-12 col-sm-6 mb-2">
            <label class="d-block">Date</label>
            <input
              class="form-control"
              type="text"
              data-e2e-type="invoice-reverse-modal-date"
              :value="formattedDate"
              disabled
            >
          </div>
          <div class="col-12 col-sm-6 mb-2">
            <label class="d-block">Document number</label>
            <input
              class="form-control"
              type="text"
              data-e2e-type="invoice-reverse-modal-document-number"
              :value="invoiceId"
              disabled
            >
          </div>
        </div>
        <div class="row">
          <div class="col-12 col-sm-6 mb-2">
            <label class="d-block">Company</label>
            <input
              class="form-control"
              type="text"
              data-e2e-type="invoice-reverse-modal-company"
              :value="company"
              disabled
            >
          </div>
          <div class="col-12 col-sm-6 mb-2">
            <label class="d-block">Amount</label>
            <currency-input
              class="form-control"
              :precision="2"
              :currency="null"
              :value="amount"
              data-e2e-type="invoice-reverse-modal-amount"
              disabled />
          </div>
        </div>
        <div class="row">
          <div class="col-12 mb-2 reverse-transaction-date">
            <label class="d-block">Reverse the transaction on date</label>
            <utc-flatpickr
              data-e2e-type="invoice-reverse-modal-reverse-transaction-date"
              :config="datepickerOptions"
              v-model="reverseTransactionDate"
              :class="{'has-danger': reverseDateInputHasError }"
              class="form-control" />
          </div>
        </div>
          <div class="row">
          <div class="col-12 mb-2">
            <label class="d-block">Memo</label>
            <input
              class="form-control"
              type="text"
              data-e2e-type="invoice-reverse-modal-memo"
              v-model="memo"
            >
          </div>
        </div>
      </div>
      <div slot="modal-footer">
        <button
          class="btn mr-1 btn-primary"
          @click="submit"
          :disabled="!canSubmit"
          data-e2e-type="invoice-reverse-modal-submit-button"
        >
          Submit
        </button>
        <button
          class="btn btn-secondary"
          @click.prevent="hide"
          data-e2e-type="invoice-reverse-modal-submit-cancel"
        >
          Cancel
        </button>
      </div>
    </b-modal>
    <confirm-dialog
      @confirm="onDialogConfirmed"
      ref="confirmDialog"
      confirmationTitle="Invoice reversal confirmation"
      confirmationMessage="You are about to reverse an invoice. This action is irreversible. Would you like to continue?"/>
  </div>
</template>

<script src="./invoice-reverse-modal.js" />
<style lang="scss" src="./invoice-reverse-modal.scss"></style>