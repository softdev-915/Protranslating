<template>
  <div class="ip-wrapper" :class="{'blur-loading-row' :loading}">
    <div class="ip-card wizard-ip-card ">
      <div class="ip-card__wizard-header" ref="wizardHeader">
        <progress-steps :steps="steps" :current="currentStep" />
      </div>
      <div class="ip-card__divider"></div>
      <div class="ip-card__body">
        <patent-authentication v-model="patentNumber" v-if="isPatentAuthenticationStep" />
        <patent-details
          v-else-if="isPatentDetailsStep"
          :value="epo"
          :translationOnly="translationOnly"
          :isOrder="isOrder"
          @input="onPatentDetailsUpdate"
        />
        <div v-else-if="isCountriesStep" class="countries-container">
          <granted-claims-translation
            v-if="translationOnly"
            translationOnly
            :epo="epo"
            v-model="claimsTranslationGranted"
            @claims-translation-validation="onClaimsTranslationValidation"
            @on-granted-claims-update="onGrantedClaimsUpdate"
          />
          <h4 class="body__header mt-4" data-e2e-type="countries-header">Select Countries</h4>
          <p class="body__text" data-e2e-type="countries-text">
            Your Patent will be translated for the countries selected
          </p>
          <ip-epo-countries-selector
            class="mt-4"
            placeholder="Select Important Countries"
            withFlags
            isInstantQuote
            :value="countriesSelected"
            @onUpdate="onCountriesUpdate"
          />
        </div>
        <instant-quote
          v-if="isInstantQuoteStep"
          :translationFees="translationFees"
          :claimsTranslationFees="claimsTranslationFees"
          :disclaimers="disclaimers"
          :epo="epo"
          :currencies="currencies"
          :quoteCurrency="quoteCurrency"
          :translationOnly="translationOnly"
          :is-new="isNew"
          :isOrder="isOrder"
          :epoTemplate="epoTemplate"
          @total-fee-calculated="onTotalFeeCalculation"
          @currency-selected="onCurrencySelect"/>
        <div class="body__controls">
          <div
            class="ip-button-text"
          >
            <div
            :class="{ disabled: loading }"
            @click="decrementStep"
            data-e2e-type="back-button"
            v-show="showBackButton"
            >
            <i class="fas fa-arrow-left"></i>
            <span>Back</span>
          </div>
          </div>
          <div class="d-flex align-items-center">
            <ip-popup
              v-if="isLastStep"
              :tabindex="1"
              class="mr-3"
              style="width: 188px"
              data-e2e-type="quote-actions-popup"
            >
              <div @click="exportPdf" data-e2e-type="export-quote">Save & Export to PDF</div>
              <div @click="exportCsv" data-e2e-type="export-quote-csv">Save & Export to CSV</div>
              <div @mousedown="saveQuote(false, true)" data-e2e-type="save-quote">Save Quote</div>
              <div @click="openDiscardQuoteModal" class="danger-text" data-e2e-type="discard-quote">Discard Quote</div>
            </ip-popup>
            <div
              v-if="currentStep === maxSteps - 1"
              class="ip-button-filled"
              :class="{ 'ip-disabled': loading }"
              @click="approveQuote"
              data-e2e-type="approve-quote"
            >
              Approve Quote
            </div>
            <div
              v-else
              class="ip-button-filled"
              :class="{ 'ip-disabled': loading }"
              @click="incrementStep"
              data-e2e-type="next-step"
            >
              Next
            </div>
          </div>
        </div>
      </div>
    </div>
    <quote-details
      :title="quoteDetailsTitle"
      :service="service"
      :database="database"
      :countriesSelected="countriesSelected"
      :epo="epo"
      :step="currentStep"
      :translationOnly="translationOnly"
      :claimsTranslationGranted="claimsTranslationGranted"
      :isClaimsTranslationGrantedProvided="isClaimsGrantedCountries"
    />
     <saved-quote
      :requestNumber="requestEntity.no"
      :requestId="requestEntity._id"
      :isNew="isNew"
      v-if="showSavedQuoteModal"
    ></saved-quote>
    <saved-and-pdf-quote
      :requestNumber="requestEntity.no"
      :requestId="requestEntity._id"
      v-else-if="showExportQuoteModal"
      @modal-closed="onCloseQuotePopup"
    ></saved-and-pdf-quote>
    <discard-quote v-model="showDiscardQuoteModal" @discarded="discardQuote"/>
    <approve-quote v-model="showApproveModal" :request="requestEntity" :track-submit="trackSubmit" />
  </div>
</template>

<script src="./epo-create.js"></script>
<style scoped lang="scss" src="./create.scss"></style>
<style lang="scss" scoped src="./epo-create.scss"></style>
