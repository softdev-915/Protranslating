<template>
  <div :class="{ 'blur-loading-row': isLoading }">
    <button
      :class="['btn', enableNewButton ? 'btn-new-primary' : 'btn-primary']"
      :disabled="disabled || !this.canMakePayment"
      @click="show"
      data-e2e-type="payment-modal-make-payment"
    >
      Make a Payment
    </button>
    <b-modal
      hide-header-close
      ref="modal"
      class="cc-payments-modal"
      @close="hide"
      data-e2e-type="payment-modal-body"
    >
      <div slot="modal-header" class="w-100">
        <h6>Make a payment</h6>
      </div>
      <div slot="default">
        <div class="row">
          <div class="col-12">
            <input
              type="text"
              class="form-control mb-3"
              placeholder="Card number"
              v-model="payment.card.no"
              v-mask="currentCardMask"
              data-e2e-type="payment-modal-card-no"
            >
          </div>
          <div class="col-6">
            <input
              type="text"
              class="form-control"
              :value="cardType"
              placeholder="Card Type"
              disabled
              data-e2e-type="payment-modal-card-type"
            >
          </div>
          <div class="col-6 d-flex align-items-center mb-2 mb-sm-0">
            <input
              type="text"
              class="form-control"
              placeholder="MM"
              v-mask="dateMask"
              v-model="payment.card.month"
              data-e2e-type="payment-modal-card-month"
            >
            <span class="mx-2 card-date-separator">/</span>
            <input
              type="text"
              class="form-control"
              placeholder="YY"
              v-mask="dateMask"
              v-model="payment.card.year"
              data-e2e-type="payment-modal-card-year"
            >
          </div>
        </div>
        <div class="row">
          <div class="col-12 col-sm-6 mb-2">
            <label class="d-block required">Email</label>
            <input
              class="form-control"
              v-model="payment.billTo.email"
              type="text"
              data-e2e-type="payment-modal-bill-email"
            >
          </div>
          <div class="col-12 col-sm-6 mb-2">
            <label class="d-block required">Name</label>
            <input
              class="form-control"
              v-model="payment.billTo.firstName"
              type="text"
              data-e2e-type="payment-modal-bill-first-name"
            >
          </div>
          <div class="col-12 col-sm-6 mb-2">
            <label class="d-block required">Last Name</label>
            <input
              class="form-control"
              v-model="payment.billTo.lastName"
              type="text"
              data-e2e-type="payment-modal-bill-last-name"
            >
          </div>
          <div class="col-12 mb-2" :class="{ 'blur-loading-row': areCountriesLoading }">
            <label class="d-block required">Country</label>
            <simple-basic-select
              placeholder="Country"
              v-model="payment.billTo.country"
              @select="retrieveStates"
              :options="countries"
              :format-option="countriesFormatter"
              data-e2e-type="payment-modal-bill-country"
            />
          </div>
          <div class="col-12 mb-2" :class="{ 'blur-loading-row': areStatesLoading }">
            <label class="d-block required">Administrative Area</label>
            <simple-basic-select
              placeholder="Select administrative area"
              v-model="payment.billTo.state"
              :options="states"
              :format-option="statesFormatter"
              data-e2e-type="payment-modal-bill-state"
            />
          </div>
          <div class="col-12 mb-2">
            <label class="d-block required">City</label>
            <input
              class="form-control"
              v-model="payment.billTo.city"
              type="text"
              data-e2e-type="payment-modal-bill-city"
            >
          </div>
          <div class="col-12 mb-2">
            <label class="d-block required">Address 1</label>
            <input
              class="form-control"
              v-model="payment.billTo.address1"
              type="text"
              data-e2e-type="payment-modal-bill-address1"
            >
          </div>
          <div class="col-12 mb-2">
            <label class="d-block">Address 2</label>
            <input
              class="form-control"
              v-model="payment.billTo.address2"
              type="text"
              data-e2e-type="payment-modal-bill-address2"
            >
          </div>
          <div class="col-12 mb-2">
            <label class="d-block required">Postal Code</label>
            <input
              class="form-control"
              v-model="payment.billTo.zipCode"
              type="text"
              data-e2e-type="payment-modal-bill-zip-code"
            >
          </div>
          <div class="col-12">
            <label class="d-block required">Amount</label>
            <currency-input
              disabled
              class="form-control"
              :currency="null"
              :precision="2"
              :value="amount"
              data-e2e-type="payment-modal-amount"
            />
          </div>
        </div>
      </div>
      <div slot="modal-footer">
        <button
          class="btn mr-1 btn-primary"
          @click="submit"
          :disabled="!isFormValid"
          data-e2e-type="payment-modal-submit-button"
        >
          Submit
        </button>
        <button
          class="btn btn-secondary"
          @click.prevent="hide"
          data-e2e-type="payment-modal-submit-cancel"
        >
          Cancel
        </button>
      </div>
    </b-modal>
  </div>
</template>

<script src="./cc-payment-modal.js" />
<style lang="scss" src="./cc-payments-modal.scss" />
