<template>
  <div class="ip-wrapper">
    <div class="ip-card wizard-ip-card">
      <div class="ip-card__wizard-header" ref="wizardHeader">
        <progress-steps :steps="steps" :current="currentStep" />
      </div>
      <div class="ip-card__divider"></div>
      <div class="ip-card__body">
        <div v-if="currentStep === 0">
          <h4 class="body__header">Patent Authentication</h4>
          <p class="body__text">
            The system will pull the details of your patent from the PCT
            Application or entered Publication Number
          </p>
          <ip-input
            style="width: 500px; margin-top: 24px"
            placeholder="PCT Application / Publication Number"
            data-e2e-type="publication-number"
            :disabled="loading"
            @change="reset"
            v-model="patentNumber"
          />
          <p class="body__tip">eg. PCT/US1234/567890 or WO/1234/56789</p>
        </div>
        <div v-else-if="currentStep === 1">
          <h4 class="body__header">Patent Details</h4>
          <p class="body__text">
            Your Patent details based on the patent number entered. Review the
            fields below and edit if necessary.
          </p>
          <div class="patent-details">
            <ip-date-input
              required
              placeholder="Requested Delivery Date"
              data-e2e-type="requested-delivery-date"
              v-model="requestedDeliveryDate"
            />
            <ip-input
              placeholder="Reference Number (Optional)"
              data-e2e-type="reference-number"
              v-model="referenceNumber"
            />
          </div>
          <h4 v-if="!isOrder" class="body__header mt-3">Counts</h4>
          <div v-if="!isOrder" class="counts-wrapper">
            <ip-input
              type="number"
              required
              placeholder="Abstract Word Count"
              data-e2e-type="abstract-word-count"
              v-model="abstractWordCount"
            />
            <ip-input
              type="number"
              required
              placeholder="Description Word Count"
              data-e2e-type="description-word-count"
              v-model="descriptionWordCount"
            />
            <ip-input
              type="number"
              required
              placeholder="Claims Word Count"
              data-e2e-type="claims-word-count"
              v-model="claimsWordCount"
            />
            <div v-if="isTranslationOnlyQuote" class="ip-field">
              <ip-input
                type="number"
                placeholder="Number of Drawings"
                data-e2e-type="number-of-drawings"
                v-model="numberOfDrawings"
              />
              <div v-if="isNumberOfDrawingsEmpty" class="ip-field__help">
                <p class="ip-tooltip">
                  If the Number of Drawings is not known, our operations team
                  will update this after you submit your quote.
                </p>
                <p class="remark">Enter estimated value (if known)</p>
              </div>
            </div>
            <div v-else class="ip-field">
              <ip-input
                type="number"
                placeholder="Number of Total Pages"
                data-e2e-type="number-of-total-pages"
                v-model="numberOfTotalPages"
              />
              <div v-if="isNumberOfTotalPagesEmpty" class="ip-field__help">
                <p class="ip-tooltip">
                  If the Number of Total Pages is not known, our operations team
                  will update this after you submit your quote.
                </p>
                <p class="remark">Enter estimated value (if known)</p>
              </div>
            </div>
            <ip-input
              v-if="!isTranslationOnlyQuote"
              type="number"
              required
              placeholder="Number of Priority Applications"
              data-e2e-type="number-of-priority-applications"
              v-model="numberOfPriorityApplications"
            />
            <ip-input
              v-if="!isTranslationOnlyQuote"
              type="number"
              required
              placeholder="Number of Claims"
              data-e2e-type="number-of-claims"
              v-model="numberOfClaims"
            />
            <div class="ip-field">
              <ip-input
                type="number"
                placeholder="Drawings Page Count"
                data-e2e-type="drawings-page-count"
                v-model="numberOfDrawingPages"
              />
              <div v-if="isNumberOfDrawingPagesEmpty" class="ip-field__help">
                <p class="ip-tooltip">
                  If the Drawings Page Count is not known, our operations team
                  will update this after you submit your quote.
                </p>
                <p class="remark">Enter estimated value (if known)</p>
              </div>
            </div>
            <div class="ip-field">
              <ip-input
                type="number"
                placeholder="Drawings Word Count"
                data-e2e-type="drawings-word-count"
                v-model="drawingsWordCount"
              />
              <div class="ip-field__help">
                <p class="ip-tooltip">
                  If the Drawings Word Count is not known, our operations team
                  will update this after you submit your quote.
                </p>
                <p class="remark">Enter estimated value (if known)</p>
              </div>
            </div>
            <div
              v-if="!isTranslationOnlyQuote"
              class="ip-field">
              <ip-input
                type="number"
                placeholder="Number of Independent Claims"
                data-e2e-type="number-of-independent-claims"
                v-model="numberOfIndependentClaims"
              />
              <div class="ip-field__help">
                <p class="ip-tooltip">
                  If the Number of independent claims is not known, our operations team
                  will update this after you submit your quote.
                </p>
                <p class="remark">Enter estimated value (if known)</p>
              </div>
            </div>
          </div>
          <div v-if="showAnnuityQuotationCheckbox" class="mt-5 annuity-quotation-section">
            <h4 class="body__header" data-e2e-type="wipo-annuity-quotation-header">Annuity Quotation</h4>
            <div class="mt-2">
              <label for="wipoRequireAnnuityQuotation">
                <input
                  id="wipoRequireAnnuityQuotation"
                  data-e2e-type="wipo-annuity-quotation-required"
                  type="checkbox"
                  v-model="isAnnuityQuotationRequired">
                <span>Annuity Quotation Required</span>
              </label>
            </div>
          </div>
        </div>
        <div v-else-if="currentStep === 2">
          <h4 class="body__header">Select Countries</h4>
          <p class="body__text">
            Your patent will be translated for the countries selected
          </p>
          <div class="body__label mt-4">
            <i class="fas fa-angle-double-right" style="color: #62a4cd"></i>
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
            :isEntityDisplay="sholdDisplayCountryEntities"
            listSize="extra-big"
            data-e2e-type="instant-quote-countries-selector"
            @onUpdate="onInstantCountriesUpdate"
          />
          <div class="body__label mt-4">
            <i class="fas fa-angle-double-right" style="color: #62a4cd"></i>
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
            data-e2e-type="custom-quote-countries-selector"
            @onUpdate="onCustomCountriesUpdate"
          />
        </div>
        <div v-else-if="currentStep === 3 && !isOrder" class="instant-quote-container">
          <h4 data-e2e-type="instant-quote-title" class="body__header">
            {{ finalTitle }}
          </h4>
          <table
            v-if="showTranslationFees"
            class="mt-5"
            :class="[
              { 'instant-quote-table-translation-only': translationOnly },
              { 'translation-and-filing-table': !translationOnly }
            ]"
            data-e2e-type="instant-quote-table"
          >
            <thead>
              <tr>
                <th :class="{'country-row': !translationOnly}">COUNTRY</th>
                <th v-if="!translationOnly" class="right">AGENCY FEE</th>
                <th v-if="!translationOnly" class="right">OFFICIAL FEE </th>
                <th :class="{'right': !translationOnly}">TRANSLATION FEE</th>
                <th v-if="!translationOnly" class="right">TOTAL</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="(fee, index) in translationFees"
                :key="index"
                :data-e2e-type="fee.country"
              >
                <td>{{ fee.country }}</td>
                <td v-if="fee.neededQuotation" colspan="4" data-e2e-type="neededQuotation">
                  <span class="custom">Our team is preparing your customized quote</span>
                </td>
                <template v-else>
                  <td v-if="!translationOnly" class="right" data-e2e-type="agencyFee">
                    <span class="currency-symbol">{{ quoteCurrency.symbol }}</span>
                    {{ formatFee( fee.agencyFeeCalculated[quoteCurrency.isoCode]) }}
                  </td>
                  <td v-if="!translationOnly" class="right" data-e2e-type="officialFee">
                    <span class="currency-symbol">{{ quoteCurrency.symbol }}</span>
                    {{ formatFee( fee.officialFeeCalculated[quoteCurrency.isoCode]) }}
                  </td>
                  <td :class="{'right': !translationOnly}" data-e2e-type="translationFee">
                    <span class="currency-symbol">{{ quoteCurrency.symbol }}</span>
                    {{ formatFee(fee.translationFeeCalculated[quoteCurrency.isoCode]) }}
                  </td>
                  <td v-if="!translationOnly" class="right" data-e2e-type="feeTotal">
                    <span class="currency-symbol">{{ quoteCurrency.symbol }}</span>
                    {{ formatFee(calculateTotal(fee)) }}
                  </td>
                </template>
              </tr>
              <tr v-if="showAnnuityPaymentRow">
                <td>{{ annuityPaymentRow.name }}</td>
                <td colspan="4">
                  <span class="custom">{{ annuityPaymentRow.message }}</span>
                </td>
              </tr>
            </tbody>
          </table>
          <nodb-not-calculated
            v-else
            data-e2e-type="no-instant-quote-page"
            class="mt-3"
            :request-number="requestNumber"
            :requestId="requestEntity._id"
            :quoted-countries="countryNamesStr"
            :sourceLanguage="sourceLanguageName"
            :isNew="isNew"
            :isNewCountryAdded="isNewCountryAdded"
            :areCountsChanged="areCountsChanged"
            :isInstantSourceLanguage="isInstantSourceLanguage"
          />
          <div v-if="showTranslationFees" class="body__price">
            <ip-select
              :is-disabled="!isNew"
              class="currency-switcher"
              :options="currencies"
              item-key="isoCode"
              data-e2e-type="currencies-select"
              v-model="quoteCurrency"
            />
            <div class="price__total">
              <span>TOTAL: </span>
              <span data-e2e-type="quote-total">{{
                `${quoteCurrency.isoCode} ${formatFee(totalFee)}`
              }}</span>
            </div>
          </div>
          <div
            v-if="showTranslationFees"
            class="body__bullets mt-4"
            data-e2e-type="quote-disclaimers"
          >
            <p v-for="disclaimer in quoteDisclaimers" :key="disclaimer.id">
              {{ `• ${disclaimer.disclaimer}` }}
            </p>
          </div>
          <div class="pdf-container" v-html="wipoTemplate"/>
        </div>
        <order-details
          @order-details-validation="onOrderDetailsValidation"
          @order-details-updated="onOrderDetailsUpdate"
          v-if="currentStep === 3 && isOrder">
        </order-details>
        <div v-if="!hideControls && !isOrder" class="body__controls">
          <div
            class="ip-button-text"
          >
            <div
              :class="{ disabled: loading }"
              @click="decrementStep"
              v-show="showBackButton"
              data-e2e-type="quote-back-step-button"
            >
              <i class="fas fa-arrow-left"></i>
              <span>Back</span>
            </div>
          </div>
          <div class="d-flex align-items-center">
            <ip-popup
              v-if="currentStep === maxSteps - 1"
              :tabindex="1"
              class="mr-2"
              style="width: 188px"
              data-e2e-type="quote-actions-popup"
            >
              <div @click="exportPdf" data-e2e-type="export-quote">Save & Export to PDF</div>
              <div @click="exportCsv" data-e2e-type="export-quote-csv">Save & Export to CSV</div>
              <div @mousedown="saveQuote({ track: true })" data-e2e-type="save-quote">Save Quote</div>
              <div
                class="danger-text"
                data-e2e-type="discard-quote"
                @click="openDiscardQuoteModal"
              >
                {{ discardButtonText }}
              </div>
            </ip-popup>
            <div
              v-if="currentStep === maxSteps - 1"
              class="approve-quote-container"
              :class="{ 'approve-disabled': !canApproveQuote }"
            >
              <div
              class="ip-button-filled"
              data-e2e-type="approve-quote"
              @click="approveQuote"
              :class="{ 'ip-disabled': loading }"
              >
                Approve Quote
              </div>
              <p data-e2e-type="approve-quote-tooltip" class="ip-tooltip">
                This quote cannot be approved since at least one custom country is selected
              </p>
            </div>
            <div
              v-else
              class="ip-button-filled"
              :class="{ 'ip-disabled': loading }"
              data-e2e-type="ip-next-step-button"
              @click="incrementStep"
            >
              Next
            </div>
          </div>
        </div>
        <div v-if="isOrder" class="body__controls">
          <div
            class="ip-button-text"
            :class="{ disabled: loading }"
            @click="decrementStep">
            <i class="fas fa-arrow-left"></i>
            <span>Back</span>
          </div>
          <div class="d-flex align-items-center">
            <div v-if="currentStep === maxSteps - 1" class="order-detail-button">
              <ip-button
                class="mr-4"
                :class="{ 'ip-disabled': loading }"
                data-e2e-type="ip-discard-order-button"
                @click.native="openDiscardOrderModal">
                Discard
              </ip-button>
            </div>
            <div v-if="currentStep === maxSteps - 1" class="ml-2 order-detail-button">
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
              data-e2e-type="ip-next-step-button"
              @click="incrementStep">
              Next
            </div>
          </div>
        </div>
      </div>
    </div>
    <ip-card class="ml-3 quote-details-card">
      <div class="ip-card__header">
        <span v-if="!isOrder">Your Quote Details</span>
        <span v-else>Your Order Details</span>
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
        <h5 v-if="isFirstStepFilled" class="record-header mt-3 mb-3">Patent</h5>
        <div v-if="isFirstStepFilled" class="detail__info">
          <div class="record-wide d-flex flex-column align-items-start">
            <span class="record-wide__header">Patent Title</span>
            <span>{{ patentTitle }}</span>
          </div>
        </div>
        <div v-if="isFirstStepFilled" class="detail__info mt-3">
          <div class="record d-flex flex-column align-items-start">
            <span class="record__header">Requested by</span>
            <span>{{ requestedBy }}</span>
          </div>
          <div class="record d-flex flex-column align-items-start">
            <span class="record__header">Sales Representative</span>
            <span>
              <a :href="`mailto:${salesRepEmail}`" target="_blank">
                <i class="fas fa-envelope" style="color: #408dca" />
              </a>
              <span class="ml-2">{{ salesRep }}</span></span
            >
          </div>
        </div>
        <div v-if="isFirstStepFilled" class="detail__info mt-3">
          <div class="record d-flex flex-column align-items-start">
            <span class="record__header">Patent Application Number</span>
            <span>{{ wipoPCTReference }}</span>
          </div>
          <div class="record d-flex flex-column align-items-start">
            <span class="record__header">Patent Publication Number</span>
            <span>{{ patentPublicationNumber }}</span>
          </div>
        </div>
        <div v-if="isFirstStepFilled" class="detail__info mt-3">
          <div class="record-wide d-flex flex-column align-items-start">
            <span class="record-wide__header">Applicant(s)</span>
            <span>{{ applicantName }}</span>
          </div>
        </div>
        <div v-if="isFirstStepFilled" class="detail__info mt-3">
          <div class="record d-flex flex-column align-items-start">
            <span class="record__header">30-month Deadline</span>
            <span>{{ formatDate(thirtyMonthsDeadline) }}</span>
          </div>
        </div>
        <div v-if="currentStep > 1 && !isOrder">
          <h5 class="record-header mt-3 mb-3">
            Counts
          </h5>
          <div class="detail__info mt-3">
            <div class="record d-flex flex-column align-items-start">
              <span class="record__header">Abstract Word Count</span>
              <span>{{ formatNumber(abstractWordCount) }}</span>
            </div>
            <div class="record d-flex flex-column align-items-start">
              <span class="record__header">Description Word Count</span>
              <span>{{ formatNumber(descriptionWordCount) }}</span>
            </div>
          </div>
          <div class="detail__info mt-3">
            <div class="record d-flex flex-column align-items-start">
              <span class="record__header">Claims Word Count</span>
              <span>{{ formatNumber(claimsWordCount) }}</span>
            </div>
            <div v-if="isTranslationOnlyQuote" class="record d-flex flex-column align-items-start">
              <span class="record__header">Number of Drawings</span>
              <span>{{ formatNumber(numberOfDrawings) }}</span>
            </div>
            <div v-else class="record d-flex flex-column align-items-start">
              <span class="record__header">Number of total pages</span>
              <span>{{ formatNumber(numberOfTotalPages) }}</span>
            </div>
          </div>
          <div class="detail__info mt-3">
            <div class="record d-flex flex-column align-items-start">
              <span class="record__header">Drawings Word Count</span>
              <span>{{ formatNumber(drawingsWordCount) }}</span>
            </div>
            <div class="record d-flex flex-column align-items-start">
              <span class="record__header">Drawings Page Count</span>
              <span>{{ formatNumber(numberOfDrawingPages) }}</span>
            </div>
          </div>
          <div v-if="!isTranslationOnlyQuote" class="detail__info mt-3">
            <div class="record d-flex flex-column align-items-start">
              <span class="record__header">Number of priority applications</span>
              <span>{{ formatNumber(numberOfPriorityApplications) }}</span>
            </div>
            <div class="record d-flex flex-column align-items-start">
              <span class="record__header">Number of independent claims</span>
              <span>{{ formatNumber(numberOfIndependentClaims) }}</span>
            </div>
          </div>
          <div v-if="!isTranslationOnlyQuote" class="detail__info mt-3">
            <div class="record d-flex flex-column align-items-start">
              <span class="record__header">Number of claims</span>
              <span>{{ formatNumber(numberOfClaims) }}</span>
            </div>
          </div>
        </div>
        <h5 v-if="currentStep > 2" class="record-header mt-3 mb-3">
          Countries
        </h5>
        <div v-if="currentStep > 2" class="detail__info mt-3">
          <div class="record-wide d-flex flex-column align-items-start">
            <span>{{ countryNamesStr }}</span>
          </div>
        </div>
      </div>
    </ip-card>
    <ip-modal width="500px" height="380px" v-model="showSavedQuoteModal">
      <template slot="header">
        <span data-e2e-type="ip-modal-title">{{ modalTitle }}</span>
      </template>
      <div class="ip-modal-body">
        <i class="fas fa-check-circle ip-modal-body-icon ip-modal-body-icon__success" />
        <div class="ip-modal-body__message" data-e2e-type="ip-modal-description">{{ modalDescription }}</div>
        <div class="ip-modal-body__request">
          <span>Your Request Number is: </span>
          <a href="#" data-e2e-type="request-number" @click="onQuoteDetailEnter">{{ requestNumber }}</a>
        </div>
        <div
          class="ip-button mt-4"
          style="height: 50px; font-size: 16px;"
          data-e2e-type="enter-quote-detail-button"
          @click="onQuoteDetailEnter"
        >
          {{ !isOrder ? 'See your quote' : 'See your order' }}
        </div>
      </div>
    </ip-modal>
    <ip-modal width="468px"  v-model="showDiscardQuoteModal">
      <template slot="header">
        <span data-e2e-type="ip-modal-title">Discard quote</span>
      </template>
       <div class="ip-modal-body">
          <i class="fas fa-times-circle ip-modal-body-icon ip-modal-body-icon__warning" />
          <div class="ip-modal-body__message" data-e2e-type="ip-modal-description">
            Discard unsaved quote changes!
          </div>
          <div class="ip-modal-body__controls w-100">
            <ip-button class="mr-4" @click.native="showDiscardQuoteModal=false"> Cancel </ip-button>
            <ip-button data-e2e-type="ip-discard-modal-discard-button" type="filled" @click.native="discardQuote"> Discard </ip-button>
          </div>
        </div>
    </ip-modal>
    <ip-modal width="468px" class="pb-2" v-model="showExportQuoteModal" :closeIcon="false">
      <template slot="header">
        <span data-e2e-type="ip-modal-title">Quote Saved and Downloaded!</span>
      </template>
      <div class="ip-modal-body">
        <i class="fas fa-check-circle ip-modal-body-icon ip-modal-body-icon__success" />
        <div class="ip-modal-body__message" data-e2e-type="ip-modal-description">Quote downloaded successfully!</div>
        <div class="ip-modal-body__request">
          <span>Your Request Number is: </span>
          <router-link
            v-if="requestId"
            data-e2e-type="success-save-and-download-pdf-request-number"
            tag="a"
            :to="{ name:'quote-quote-detail', params: { requestId: requestId } }"
            title="Contact Us">
            <span>{{ requestNumber }}</span>
          </router-link>
        </div>
         <div class="ip-modal-body__controls w-100">
          <ip-button
            type="filled"
            data-e2e-type="ip-modal-export-close-button"
            @click.native="onCloseQuotePopup"
          >Close</ip-button>
         </div>
      </div>
    </ip-modal>
    <ip-modal width="600px" marginTop="164px" v-model="showApproveModal">
      <template slot="header">
        <span data-e2e-type="ip-modal-title">Quote Approved!</span>
      </template>
      <div class="ip-modal-body approve-modal-body">
        <i
          class="fas fa-check-circle ip-modal-body-icon ip-modal-body-icon__success"
        />
        <div class="ip-modal-body__message" data-e2e-type="ip-modal-description">Quote approved successfully!</div>
        <div class="ip-modal-body__request">
          <span>Your Request Number is: </span>
          <span data-e2e-type="request-number">{{ requestNumber }}</span>
        </div>
        <div class="ip-modal-body__subheader mt-4">
          Complete your order entering the fields below!
        </div>
        <ip-input
          class="ip-modal-body__textarea mt-4 w-100"
          data-e2e-type="ip-approve-quote-comments-input"
          placeholder="Instructions and comments"
          v-model="instructionsAndComments"
        />
        <div class="ip-modal-body__subheader mt-4">
          Files
        </div>
        <ip-file-upload @file-upload="onFilesUpload" class="mt-4"/>
        <div class="ip-modal-body__controls w-100">
          <ip-button class="mr-4" @click.native="showApproveModal = false">Cancel</ip-button>
          <ip-button
            type="filled"
            data-e2e-type="approve-modal-save-button"
            @click.native="saveAndSeeQuote"
          >Submit and see your order</ip-button>
        </div>
      </div>
    </ip-modal>
  </div>
</template>

<script src="./create.js"></script>
<style scoped lang="scss" src="./create.scss"></style>
<style lang="scss" src="./pdf-shared.scss"></style>
