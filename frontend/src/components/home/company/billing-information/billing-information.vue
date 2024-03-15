<template>
  <div class="col-12 mt-4 pt-0">
    <h5>Billing information</h5>
    <hr class="my-1">
    <div class="container-fluid pl-0 pr-0" data-e2e-type="billing-information-container">
      <div class="row">
        <div class="col-12 col-md-4">
          <div class="row align-items-center form-group">
            <label class="col-9" for="purchase-order-required">Purchase order required</label>
            <div class="col-3">
              <input
                id="purchase-order-required"
                type="checkbox"
                :disabled="!canEdit"
                class="form-control pts-clickable"
                v-model="billingInformation.purchaseOrderRequired"
                value="true"
                aria-label="Purchase order required"
                data-e2e-type="purchase-order-checkbox">
            </div>
          </div>
        </div>
        <div class="col-12 col-md-4 mt-1">
          <div class="align-items-center form-group">
            <div class="col-12 pl-2">Billing terms</div>
            <div class="row justify-content-start align-items-center">
              <div class="col-6" data-e2e-type="billing-term-select-container">
                <billing-term-selector
                  :disabled="!canEdit"
                  data-e2e-type="billing-term-select"
                  v-model="selectedBillingTerm"
                  placeholder="Billing terms"
                  title="Billing term's list">
                </billing-term-selector>
              </div>
              <div class="col-6 mobile-align-right" v-if="canEdit">
                <button
                  data-e2e-type="manage-billing-terms-button"
                  class="btn btn-primary"
                  @click="manageBillingTerms">Manage</button>
              </div>
            </div>
          </div>
        </div>
        <div class="col-12 col-md-4 mt-1">
          <label class="col-12 pl-2 form-check-label">Form of payment</label>
          <div class="row justify-content-start align-items-center">
            <div class="col-9">
              <payment-method-selector
                :disabled="!canEdit"
                :data-e2e-type="'payment-method-select'"
                v-model="selectedPaymentMethod"
                placeholder="Form of payment"
                title="Payment's form list">
              </payment-method-selector>
            </div>
            <div class="col-3 mobile-align-right" v-if="canEdit">
              <button
                data-e2e-type="manage-payment-methods-button"
                class="btn btn-primary"
                @click="managePaymentMethods">Manage</button>
            </div>
          </div>
        </div>
      </div>
      <div class="row">
        <div class="col-12 col-md-3">
          <div class="row align-items-center form-group">
            <div class="col-6">Account on hold</div>
            <div class="col-6">
              <input
                type="checkbox"
                class="form-control pts-clickable"
                v-model="billingInformation.onHold"
                value="true"
                aria-label="Account on hold"
                data-e2e-type="on-hold-checkbox"
                :disabled="!canEdit">
            </div>
          </div>
        </div>
        <div class="col-12 col-md-5">
          <div class="align-items-center form-group">
            <div class="col-12 pl-2">Reason</div>
            <div class="col-12 pl-2 mt-2">
              <input
                v-model="billingInformation.onHoldReason"
                class="form-control"
                :disabled="!billingInformation.onHold || !canEdit"
                data-e2e-type="reason-input"
                title="Reason">
            </div>
          </div>
        </div>
        <div class="col-12 col-md-4">
          <div class="col-12 pl-2">Gross profit %</div>
          <div class="col-5 mt-2 pl-2">
            <input
              type="number"
              min="0"
              :disabled="!canEdit"
              v-model.number="billingInformation.grossProfit"
              title="Gross profit"
              class="form-control"
              v-validate="'required|regex:^[0-9]+'"
              data-e2e-type="gross-profit-input">
          </div>
        </div>
      </div>
      <div class="row">
        <div class="col-6">
          <label for="quote-currency"><span class="pts-required-field">*</span> Preferred Currency</label>
        </div>
        <div class="col-12 align-items-center form-group">
          <currency-selector
            v-model="selectedQuoteCurrency"
            id="quote-currency"
            data-e2e-type="quote-currency-select"
            placeholder="Preferred Currency"
            title="Currency quote"
            :format-option="formatCurrencySelectOption"
            :show-options="lspExchangeDetails"
            :isDisabled="!canEdit">
          </currency-selector>
        </div>
      </div>
      <div class="row">
        <div class="col-12">
          <h5>Billing notes</h5>
        </div>
        <div class="col-12">
          <div class="container-fluid pts-no-padding">
            <div
              class="editor-container"
              v-if="canEdit"
              data-e2e-type="billing-notes-editor-container">
              <rich-text-editor v-model="billingInformation.notes" placeholder="Notes"></rich-text-editor>
            </div>
            <div data-e2e-type="billing-notes-read-only" v-if="!canEdit" v-html="billingInformation.notes"></div>
          </div>
        </div>
        <div class="col-12 mt-4 pl-0 mb-4">
          <div class="container-fluid pts-no-padding">
            <div class="container-fluid pts-no-padding" data-e2e-type="company-rates">
              <div class="row">
                <div class="col-12">
                  <h6
                    data-e2e-type="company-min-charge-link"
                    class="pts-clickable p-md-4 d-block"
                    @click="manageCompanyMinChargeGrid($event)">
                    <a :href="companyMinChargeGridLink">
                      <u>Click to see minimum charge rates</u>
                    </a>
                  </h6>
                </div>
              </div>
              <div>
                <button
                  class="btn btn-primary mb-2"
                  data-e2e-type="rates-grid-toggle-button"
                  @click="toggleRateGrid"
                  >{{ isRateGridExpanded ? 'Hide': 'Show' }} Rates</button>
                <rates-grid
                  :canEdit="canEdit"
                  :shouldCollapseAllRates="shouldCollapseAllRates"
                  :abilities="abilities"
                  v-if="isRateGridExpanded"
                  v-model="billingInformation.rates"
                  @rates-manage-entity="onManageRateEntity"
                  @rates-validation="onRatesValidation">
                </rates-grid>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script src="./billing-information.js"></script>
