<template>
  <div class="ip-wrapper">
    <div class="ip-card wizard-ip-card">
      <div class="ip-card__wizard-header">
        <progress-steps
          :steps="steps"
          :current="currentStep"
          step-class="step-three"
        />
      </div>
      <div class="ip-card__divider"></div>
      <div class="ip-card__body">
        <div v-if="currentStep === 0">
          <h4 class="body__header">Patent Details</h4>
          <p class="body__text">Enter your patent details</p>
          <div class="patent-details">
            <ip-date-input
              class="form-input"
              :required="isRequired"
              placeholder="Requested Delivery Date"
              data-e2e-type="requested-delivery-date"
              v-model="requestedDeliveryDate"
            />
            <ip-input
              class="form-input ml-3"
              placeholder="Reference number (optional)"
              data-e2e-type="reference-number"
              v-model="referenceNumber"
            />
          </div>
          <div class="patent-details">
            <ip-date-input
              class="form-input"
              :required="isRequired"
              placeholder="Filing Deadline"
              data-e2e-type="filing-deadline"
              v-model="filingDeadline"
            />
          </div>
          <h4 class="body__header mt-3">Applicant(s)</h4>
          <div class="d-flex align-items-center mt-3">
            <ip-chips
              :value="customUsersSelected"
              :required="isRequired"
              placeholder="Type applicant's name and press the ENTER key"
              data-e2e-type="applicants"
              @select="onUserSelected"
            ></ip-chips>
          </div>
        </div>
        <div v-else-if="currentStep === 1">
          <h4 class="body__header">Select Countries</h4>
          <p class="body__text">
            Your patent will be translated for the countries selected
          </p>
          <div class="body__label mt-4">
            <i class="ip-card__icon fas fa-angle-double-right"></i>
            <span class="label__primary">Instant Quote</span>
            <span class="label__secondary"
              >(The countries listed below are available for an instant
              quote)</span
            >
          </div>
          <ip-countries-selector
            class="mt-4"
            placeholder="Instant Quote Countries"
            withFlags
            isInstantQuote
            :value="instantQuoteCountriesSelected"
            @onUpdate="onInstantCountriesUpdate"
            data-e2e-type="instant-quote-countries-selector"
            service-type="NODBService"
            listSize="small"
            entityKey='entities'
          />
          <div class="body__label mt-4">
            <i class="ip-card__icon fas fa-angle-double-right"></i>
            <span class="label__primary">Custom Quote</span>
            <span class="label__secondary"
              >(Select other countries below and our team will prepare your
              customized quote)</span
            >
          </div>
          <ip-countries-selector
            class="mt-4"
            placeholder="Custom Quote Countries"
            :value="customQuoteCountriesSelected"
            @onUpdate="onCustomCountriesUpdate"
            data-e2e-type="custom-quote-countries-selector"
            service-type="NODBService"
            entityKey='entities'
          />
        </div>
        <div class="instant-quote-container" v-else-if="currentStep === 2">
          <order-details
            @order-details-validation="onOrderDetailsValidation"
            @order-details-updated="onOrderDetailsUpdate"
            :required="isRequired"
            filesRequired
          />
          <nodb-not-calculated
            class="mt-3"
            :request-number="requestNumber"
            :requestId="requestCreated._id"
            :quoted-countries="countryNames"
            :sourceLanguage="quoteLanguage.name"
            v-if="!showTranslationFees"
          />
        </div>
        <div class="body__controls" v-if="showControlsBar">
          <div
            class="ip-button-text"
            data-e2e-type="quote-back-step-button"
            :class="{ disabled: loading }"
            @click="decrementStep"
          >
            <i class="fas fa-arrow-left"></i>
            <span>Back</span>
          </div>
          <div class="d-flex align-items-center">
            <template v-if="currentStep === maxSteps - 1">
              <div class="order-control mr-2">
                <ip-button class="order-button" @click.native="openDiscardOrderModal" data-e2e-type="discard-order">Discard</ip-button>
              </div>
              <div class="order-control">
                <ip-button class="order-button" type="filled" @click.native="saveOrder" data-e2e-type="submit-order">Submit order</ip-button>
              </div>
            </template>
            <div
              v-else
              class="ip-button-filled"
              data-e2e-type="ip-next-step-button"
              :class="{ 'ip-disabled': loading }"
              @click="incrementStep"
            >
              Next
            </div>
          </div>
        </div>
      </div>
    </div>
    <ip-card class="ml-3 quote-details-card">
      <div class="ip-card__header">
        <span>Your Order Details</span>
      </div>
      <div class="ip-card__detail">
        <div class="detail__info">
          <div class="record d-flex flex-column align-items-start">
            <span class="record__header">Service</span>
            <span>{{ service }}</span>
          </div>
          <div class="record d-flex flex-column align-items-start">
            <span class="record__header">Category</span>
            <span>{{ database }}</span>
          </div>
        </div>
        <h5 class="record-header mt-3 mb-3">Patent</h5>
        <div class="detail__info mt-3">
          <div class="record d-flex flex-column align-items-start">
            <span class="record__header">Requested by</span>
            <span>{{ requestedBy }}</span>
          </div>
          <div class="record d-flex flex-column align-items-start">
            <span class="record__header">Sales Representative</span>
            <span>
              <a :href="`mailto:${salesRepEmail}`" target="_blank">
                <i class="ip-card__icon fas fa-envelope"/>
              </a>
              <span class="ml-2">{{ salesRep }}</span></span
            >
          </div>
        </div>
        <template v-if="isFirstStepFilled">
          <div class="detail__info mt-3">
            <div class="record d-flex flex-column align-items-start">
              <span class="record__header">Requested Delivery Date</span>
              <span>{{ stringDate(requestedDeliveryDate) }}</span>
            </div>
            <div class="record d-flex flex-column align-items-start">
              <span class="record__header">Reference Number (optional)</span>
              <span>{{ referenceNumber || 'N/A' }}</span>
            </div>
          </div>

          <div class="detail__info mt-3">
            <div class="record d-flex flex-column align-items-start">
              <span class="record__header">Filing Deadline</span>
              <span>{{ stringDate(filingDeadline) }}</span>
            </div>
          </div>

          <div class="detail__info mt-3">
            <div class="record d-flex flex-column align-items-start applicants">
              <span class="record__header">Applicant(s)</span>
              <span>{{ customUsersSelected.join(', ') }}</span>
            </div>
          </div>

        </template>
        <template v-if="isThirdStepFilled">
          <h5 class="record-header mt-3 mb-3">Countries</h5>
          <div class="detail__info mt-3">
            <div class="record-wide d-flex flex-column align-items-start">
              <span>{{ countryNames }}</span>
            </div>
          </div>
        </template>
      </div>
    </ip-card>
    <saved-quote-modal
      :requestNumber="requestNumber"
      :requestId="requestCreated._id"
      ip-type="Order"
      v-if="showQuoteModal && isSaved"
    ></saved-quote-modal>
    <ip-modal
      v-else
      width="500px"
      height="380px"
      v-model="showQuoteModal"
      :closeIcon="!isPDF"
    >
      <template>
        <template slot="header">
          <span data-e2e-type="ip-modal-title">Discard Order</span>
        </template>
        <div class="ip-modal-body">
          <i
            class="
              fas
              fa-times-circle
              ip-modal-body-icon ip-modal-body-icon__warning
            "
          />
          <div class="ip-modal-body__message" data-e2e-type="ip-modal-description">
            Discard unsaved order changes!
          </div>
          <div class="ip-modal-body__controls">
            <ip-button class="mr-4" @click.native="closeModal" data-e2e-type="discard-cancel"
              >Cancel</ip-button
            >
            <ip-button type="filled" data-e2e-type="discard-approve" @click.native="reset">Discard</ip-button>
          </div>
        </div>
      </template>
    </ip-modal>
  </div>
</template>

<script src="./nodb.js"></script>
<style scoped lang="scss" src="../../ip-quote/nodb/nodb.scss"></style>
