<template>
  <div class="row" v-if="ipRates.length">
    <patent-confirm-dialog
      class="ip-modal"
      v-model="showModal"
      @confirm="onSave"
      @cancel="onClosePopup"
      width="500"
      height="330">
      <template slot="header">
        <span>Save Rate Changes</span>
      </template>
      <div class="text-center">
        <span>Rate changes made. Would you like to save?</span>
      </div>
    </patent-confirm-dialog>
    <div class="col-12 mt-1">
      <h5 class="d-inline-block mr-4">IP Details</h5>
      <hr class="my-1" />
      <div class="header">
        <v-tab class="header-tabs mr-2" :tabs="tabs" v-model="currentTab">
          <div class="header-controls">
            <button
              data-e2e-type="ip-details-cancel"
              class="btn btn-secondary mr-1"
              aria-label="Cancel edition"
              @click="onCancel"
            >Cancel</button>
            <button
              data-e2e-type="ip-details-save"
              class="btn btn-primary mr-2"
              aria-label="Save edition"
              @click="onSave"
            >Save Rates</button>
            <button data-e2e-type="ip-details-reset" class="btn btn-primary" aria-label="Reset to old values" @click="onReset">Reset</button>
          </div>
        </v-tab>
      </div>
      <div class="col-12 my-1 d-flex justify-content-between align-items-center" v-if="currentTab">
        <h6 class="d-inline-block" data-e2e-type="ip-details-warning">
          Update quote currency for all source languages, unless the customer specifies otherwise.
        </h6>
        <div class="d-flex">
          <div class="language-selector" v-show="shouldDisplayLanguageSelector">
            <span>Source Language</span>
            <simple-basic-select
              entity-name="ip-patent-language"
              :options="langs[currentTab.value]"
              v-model="selectedLanguage"
              :format-option="formatOption"
              data-e2e-type="ip-details-language-selector"
                />
          </div>
          <div class="currency-selector">
            <span>IP Quote Currency</span>
            <simple-basic-select
              entity-name="ip-patent-currency"
              :options="currencies"
              v-model="defaultCurrencyCode"
              :format-option="formatOption"
              data-e2e-type="ip-details-currency-selector"
                />
          </div>
        </div>
      </div>
      <table class="table table-striped">
        <thead>
          <tr>
            <th>Country</th>
            <th colspan="2">Translation Rate</th>
            <th colspan="2">Agency Fee</th>
          </tr>
        </thead>
        <tbody>
          <tr class="subheader">
            <td></td>
            <td>New</td>
            <td class="separator">Default</td>
            <td>New</td>
            <td>Default</td>
          </tr>
          <tr v-for="(rate, index) in ipRates" :key="`ip-rate-index-${index}`">
            <td class="country">{{ rate.country }}</td>
            <td v-if="showIndirectTranslationText && !rate[directIqField]" class="separator" colspan="2" :data-e2e-type="`translation-fee-disclaimer-for-${rate.country}`">
              Indirect Translation: {{ sourceLanguageName }} <span class="material-symbols-outlined arrow-icon">arrow_right_alt</span> English <span class="material-symbols-outlined arrow-icon">arrow_right_alt</span> {{ rate.country }}
            </td>
            <td v-else>
              {{ defaultCurrencyCode | currencyIcon }}
              <currency-input
                :data-e2e-type="`translation-fee-for-${rate.country}`"
                @input="onRateUpdate($event, index, 'translationRate')"
                :value="formatRate(rate.translationRate[defaultCurrencyCode])"
                :precision="2"
                :currency="null"
              />
            </td>
            <td v-if="!(showIndirectTranslationText && !rate[directIqField])" class="separator" :data-e2e-type="`default-translation-fee-for-${rate.country}`">{{ rate.currencyCode | currencyIcon }}{{ rate.translationRateDefault }}</td>
            <td v-if="rate.country === englishTranslationFieldName"></td>
            <td v-else>
              {{ defaultCurrencyCode | currencyIcon }}
              <currency-input
                :data-e2e-type="`agency-fee-for-${rate.country}`"
                @input="onRateUpdate($event, index, 'agencyFee')"
                :value="formatRate(rate.agencyFee[defaultCurrencyCode])"
                :precision="2"
                :currency="null"
              />
            </td>
            <td :data-e2e-type="`default-agency-fee-for-${rate.country}`">{{ rate.currencyCode | currencyIcon }}{{ rate.agencyFeeDefault }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script src='./index.js'></script>
<style src="./index.scss" lang="scss" scoped></style>