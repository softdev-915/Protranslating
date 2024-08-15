<template>
  <div class="ip-wrapper" :class="{'blur-loading-row' :loading}">
    <div class="ip-card wizard-ip-card">
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
          @claims-translation-granted-update="onClaimsTranslationGranted"
          @claims-translation-validation="onClaimsTranslationValidation"/>
        <div v-else-if="isCountriesStep" class='countries-container'>
          <granted-claims-translation
            v-if="translationOnly"
            translationOnly
            :epo="epo"
            v-model="claimsTranslationGranted"
            @claims-translation-validation="onClaimsTranslationValidation"
            @on-granted-claims-update="onGrantedClaimsUpdate"
          />
          <h4 class="body__header mt-4">Select Countries</h4>
          <p class="body__text">
            Your patent will be translated for the countries selected
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
        <order-details
          @order-details-validation="onOrderDetailsValidation"
          @order-details-updated="onOrderDetailsUpdate"
          v-if="isLastStep"/>
        <div class="body__controls">
          <div
            class="ip-button-text"
            :class="{ disabled: loading }"
            @click="decrementStep">
            <i class="fas fa-arrow-left"></i>
            <span>Back</span>
          </div>
          <div class="d-flex align-items-center">
            <div v-if="isLastStep" class="order-detail-button">
              <ip-button
                class="mr-4"
                :class="{ 'ip-disabled': loading }"
                data-e2e-type="ip-discard-order-button"
                @click.native="openDiscardOrderModal">
                Discard
              </ip-button>
            </div>
            <div v-if="isLastStep" class="ml-2 order-detail-button">
              <ip-button
                class="mr-4"
                type='filled'
                :disabled="!isValidOrderDetails"
                data-e2e-type="ip-submit-order-button"
                @click.native="saveOrder">
                Submit Order
              </ip-button>
            </div>
            <div
              v-else
              class="ip-button-filled"
              :class="{ 'ip-disabled': loading }"
              data-e2e-type="next-step"
              @click="incrementStep">
              Next
            </div>
          </div>
        </div>
      </div>
    </div>
    <quote-details
      :title='title'
      :isOrder="isOrder"
      :service="service"
      :database="database"
      :countriesSelected="countriesSelected"
      :epo="epo"
      :step="currentStep"
    />
    <ip-modal width="468px" height="374px" v-model="showSavedQuoteModal">
      <template slot="header">
        <span data-e2e-type="ip-modal-title">Order Saved!</span>
      </template>
      <div class="ip-modal-body">
        <i class="fas fa-check-circle ip-modal-body-icon ip-modal-body__success" />
        <div class="ip-modal-body__message" data-e2e-type="ip-modal-description">Order saved successfully!</div>
        <div class="ip-modal-body__request">
          <span>Your Request Number is: </span>
          <router-link
            v-if="createdRequestId"
            :to="{name:'request-edition', params: {requestId: createdRequestId}}"
            title="Contact Us">
            <span data-e2e-type="request-number">{{ requestNumber }}</span>
          </router-link>
        </div>
         <div class="ip-modal-body__controls w-100">
          <div
            class="ip-button"
            data-e2e-type="see-order-button"
            @click="onOrderDetailEnter"
          >
            See your Order
          </div>
        </div>
      </div>
    </ip-modal>
    <ip-modal width="468px"  v-model="showDiscardQuoteModal">
      <template slot="header">
        <span>Discard quote</span>
      </template>
       <div class="ip-modal-body">
          <i
            class="fas fa-times-circle ip-modal-body-icon ip-modal-body-icon__warning"
          />
          <div class="ip-modal-body__message">
            Discard unsaved quote changes!
          </div>
          <div class="ip-modal-body__controls w-100">
            <ip-button class="mr-4" @click.native="showDiscardQuoteModal=false"> Cancel </ip-button>
            <ip-button type="filled" @click.native="discardQuote"> Discard </ip-button>
          </div>
        </div>
    </ip-modal>
  </div>
</template>

<script src="./create.js"></script>
<style scoped lang="scss" src="../ip-quote/create.scss"></style>
<style lang="scss" scoped src="../ip-quote/epo-create.scss"></style>
