<template>
  <div data-e2e-type="currency-exchange-container" :class="{ 'blur-loading': loadingCurrencies }">
    <div class="row">
      <div class="col-5 exchange-details">
        <div class="row header font-weight-bold">
          <div class="col-4">Base</div>
          <div class="col-4">Quote</div>
          <div class="col-4">Quoting</div>
        </div>
        <div v-for="(detail, i) in details" class="row p-0 align-items-center exchange-row flex-nowrap" data-e2e-type="exchange-row" :key="i">
          <div class="col-12">
            <div class="row p-0">
              <div class="col-4 p-0">
                <currency-selector
                  :format-option="formatCurrencySelectOption"
                  :disabled="true"
                  :show-options="baseCurrencies"
                  v-model="detail.base"
                  data-e2e-type="exchange-base"
                  placeholder="Base"
                  :fetch-on-created="true"
                  title="Currency list"
                  :currencies-available="currencyList">
                </currency-selector>
              </div>
              <div class="col-4 p-0">
                <currency-selector
                  :format-option="formatCurrencySelectOption"
                  :disabled="shouldDisableCurrency(detail)"
                  v-model="detail.quote"
                  data-e2e-type="exchange-quote"
                  placeholder="Quote"
                  title="Currency list"
                  :fetch-on-created="true"
                  :currencies-available="currencyList">
                </currency-selector>
              </div>
              <div class="col-4 quotation">
                 <input
                   :class="{'disabled': shouldDisableCurrency(detail) }"
                   v-currency="{ precision: 5, currency: null }"
                   @keypress="onCurrencyKeyPress($event)"
                   :disabled="shouldDisableCurrency(detail)"
                   v-model="detail.quotation"
                   aria-label="Exchange quotation"
                   data-e2e-type="exchange-quotation"/>
              </div>
            </div>
          </div>
          <div class="col-1 p-0 exchange-actions" v-if="canEdit">
            <currency-exchange-actions
              data-e2e-type="exchange-actions"
              :index="i"
              :shouldDisableCurrency="shouldDisableCurrency(detail)"
              @exchange-add="onExchangeAdd"
              @exchange-delete="onExchangeDelete">
            </currency-exchange-actions>
          </div>
        </div>
        <div class="row flex-row-reverse exchange-actions-empty pr-0"
          v-if="exchangeDetails.length === 0 && canEdit">
          <currency-exchange-actions
            data-e2e-type="exchange-actions"
            :index="0"
            @exchange-add="onExchangeAdd"
            @exchange-delete="onExchangeDelete">
          </currency-exchange-actions>
        </div>
      </div>
      <div class="col ml-4 exchange-notes">
        <h6>***Formula and Notes</h6>
        <h6>BASE(USD)*Quotation(Rate)=Quote(Currency) ex: 200USD*.88(Quotation) = 176.00 EUR</h6>
      </div>
    </div>
  </div>
</template>

<script src="./currency-exchange.js"></script>
<style scoped lang="scss" src="./currency-exchange.scss"></style>
