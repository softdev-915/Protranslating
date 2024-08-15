<template>
  <div class="ip-wrapper">
    <div class="ip-card wizard-ip-card">
      <div class="ip-card__wizard-header" ref="wizardHeader">
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
              class="form-input"
              placeholder="Reference number (optional)"
              data-e2e-type="reference-number"
              v-model="referenceNumber"
            />
          </div>
          <div class="patent-details">
            <ip-select
              class="form-input"
              :options="languages"
              item-key="name"
              :required="isRequired"
              data-e2e-type="countries-select"
              v-model="quoteLanguage"
              placeholder="Source Language"
              :is-disabled="!isNew"
              is-rectangle-style
            />
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
              data-e2e-type="applicants"
              placeholder="Type applicant's name and press the ENTER key"
              @select="onUserSelected"
            ></ip-chips>
          </div>
          <h4 class="body__header mt-3">Counts</h4>
          <div class="counts-wrapper">
            <ip-input
              class="ip-input"
              type="number"
              :required="isRequired"
              placeholder="Specification Word Count"
              data-e2e-type="specification-word-count"
              v-model="specificationWordCount"
            />
            <ip-input
              class="ip-input"
              type="number"
              :required="isRequired"
              placeholder="Drawings Word Count"
              data-e2e-type="drawings-word-count"
              v-model="drawingsWordCount"
            />
            <ip-input
              class="ip-input"
              type="number"
              :required="isRequired"
              placeholder="Number of Drawings"
              data-e2e-type="number-of-drawings"
              v-model="numberOfDrawings"
            />
            <ip-input
              class="ip-input"
              type="number"
              :required="isRequired"
              placeholder="Number of Claims"
              data-e2e-type="number-of-claims"
              v-model="numberOfClaims"
            />
            <ip-input
              class="ip-input"
              type="number"
              :required="isRequired"
              placeholder="Number of Independent Claims"
              data-e2e-type="number-of-independent-claims"
              v-model="numberOfIndependentClaims"
            />
            <ip-input
              class="ip-input"
              type="number"
              :required="isRequired"
              placeholder="Total Number of Pages"
              data-e2e-type="total-number-of-pages"
              v-model="totalNumberOfPages"
            />
          </div>
          <h4 class="body__header-black mt-3">
            Does this application claim priority?
          </h4>
          <div class="d-flex align-items-center mt-3">
            <ip-radio-button
              @input="onClaimPriorityYesChanged"
              data-e2e-type="claims-translation-granted-yes"
              name="claims-translation-granted"
              :value="claimPriority"
            >
              Yes
            </ip-radio-button>
            <ip-radio-button
              class="ml-3"
              @input="onClaimPriorityNoChanged"
              data-e2e-type="claims-translation-granted-no"
              :defaultChecked="true"
              :value="!claimPriority"
            >
              No
            </ip-radio-button>
          </div>
          <h4 v-if="isNew" class="body__header mt-3">File(s)</h4>
          <ip-file-upload
            v-if="isNew"
            @file-upload="onFilesUpload"
            :required="isRequired && files.length === 0"
            data-e2e-type="source-files"
            class="mt-4"
          />
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
            is-entity-display
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
            data-e2e-type="custom-quote-countries-selector"
            @onUpdate="onCustomCountriesUpdate"
            entityKey='entities'
            service-type="NODBService"
          />
        </div>
        <div class="instant-quote-container" v-else-if="currentStep === 2">
          <div v-html="nodbTemplate" class="pdf-container"/>
          <h4 class="body__header">{{ finalTitle }}</h4>
            <nodb-not-calculated
              class="mt-3"
              :request-number="requestNumber"
              :requestId="requestEntity._id"
              :quoted-countries="countryNamesStr"
              :sourceLanguage="quoteLanguage.name"
              :is-new="isNew"
              :isNewCountryAdded="isNewCountryAdded"
              :isInstantSourceLanguage="isInstantSourceLanguage"
              :areCountsChanged="areCountsChanged"
            />
        </div>
        <div class="body__controls" v-if="showControlsBar">
          <div
            class="ip-button-text"
          >
            <div
              data-e2e-type="quote-back-step-button"
              :class="{ disabled: loading }"
              @click="decrementStep"
              v-show="showBackButton"
            >
              <i class="fas fa-arrow-left"></i>
              <span>Back</span>
            </div>
          </div>
          <div class="d-flex align-items-center">
            <ip-popup
              v-if="currentStep === maxSteps - 1"
              :tabindex="1"
              class="quote-control mr-3"
              data-e2e-type="quote-actions-popup"
            >
              <div @click="exportPdf" data-e2e-type="export-quote">Save & Export to PDF</div>
              <div @click="exportCsv" data-e2e-type="export-quote-csv">Save & Export to CSV</div>
              <div @click="saveQuote(true)" data-e2e-type="save-quote">Save Quote</div>
              <div @click="discardQuote" class="danger-text" data-e2e-type="discard-quote">
                Discard Quote
              </div>
            </ip-popup>
            <div
              v-if="currentStep === maxSteps - 1"
              class="ip-button-filled"
              :class="{ 'ip-disabled': !canApproveQuote || loading }"
              data-e2e-type="approve-quote"
              @click="openQuoteModal"
            >
              Approve Quote
            </div>
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
        <span>Your Quote Details</span>
      </div>
      <div class="ip-card__detail">
        <div class="detail__info">
          <div class="record d-flex flex-column align-items-start">
            <span class="record__header">Service</span>
            <span data-e2e-type="service-display">{{ service }}</span>
          </div>
          <div class="record d-flex flex-column align-items-start">
            <span class="record__header">Category</span>
            <span data-e2e-type="category-display">{{ database }}</span>
          </div>
        </div>
        <h5 class="record-header mt-3 mb-3">Patent</h5>
        <div class="detail__info mt-3">
          <div class="record d-flex flex-column align-items-start">
            <span class="record__header">Requested by</span>
            <span data-e2e-type="requested-by-display">{{ requestedBy }}</span>
          </div>
          <div class="record d-flex flex-column align-items-start">
            <span class="record__header">Sales Representative</span>
            <span>
              <a :href="`mailto:${salesRepEmail}`" target="_blank">
                <i class="ip-card__icon fas fa-envelope" />
              </a>
              <span class="ml-2" data-e2e-type="sales-rep">{{ salesRep }}</span></span
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
              <span class="record__header">Source Language</span>
              <span>{{ quoteLanguage.name }}</span>
            </div>
            <div class="record d-flex flex-column align-items-start">
              <span class="record__header">Filing Deadline</span>
              <span>{{ stringDate(filingDeadline) }}</span>
            </div>
          </div>

          <h5 class="record-header mt-3 mb-3">Counts</h5>

          <div class="detail__info mt-3">
            <div class="record d-flex flex-column align-items-start">
              <span class="record__header">Specification Word Count</span>
              <span>{{ formatNumber(specificationWordCount) }}</span>
            </div>
            <div class="record d-flex flex-column align-items-start">
              <span class="record__header">Drawings Word Count</span>
              <span>{{ formatNumber(drawingsWordCount) }}</span>
            </div>
          </div>

          <div class="detail__info mt-3">
            <div class="record d-flex flex-column align-items-start">
              <span class="record__header">Number of Drawings</span>
              <span>{{ formatNumber(numberOfDrawings) }}</span>
            </div>
            <div class="record d-flex flex-column align-items-start">
              <span class="record__header">Number of Independent Claims</span>
              <span>{{ formatNumber(numberOfIndependentClaims) }}</span>
            </div>
          </div>

          <div class="detail__info mt-3">
            <div class="record d-flex flex-column align-items-start">
              <span class="record__header">Number of Claims</span>
              <span>{{ formatNumber(numberOfClaims) }}</span>
            </div>
            <div class="record d-flex flex-column align-items-start">
              <span class="record__header">Total Number of Pages</span>
              <span>{{ formatNumber(totalNumberOfPages) }}</span>
            </div>
          </div>

          <h5 class="record-header mt-3 mb-3">Other</h5>

          <div class="detail__info mt-3">
            <div class="record d-flex flex-column align-items-start applicants">
              <span class="record__header">Does this apllication claim priority?</span>
              <span>{{ claimPriority ? 'Yes' : 'No' }}</span>
            </div>
          </div>

          <div class="detail__info mt-3">
            <div class="record d-flex flex-column align-items-start applicants">
              <span class="record__header">Applicant(s)</span>
              <span>{{ customUsersSelected.join(', ') }}</span>
            </div>
          </div>

          <h5 class="record-header mt-3 mb-3">Files</h5>
          <div class="detail__files">
            <div class="d-block" v-for="file in files" :key="file.name">
            <ip-uploaded-file
              class="mt-2"
              :file="getFileInfo(file)"
              :show-controls="false"
            />
            </div>
          </div>
        </template>
        <template v-if="isThirdStepFilled">
          <h5 class="record-header mt-3 mb-3">Countries</h5>
          <div class="detail__info mt-3">
            <div class="record-wide d-flex flex-column align-items-start">
              <span>{{ countryNamesStr }}</span>
            </div>
          </div>
        </template>
      </div>
    </ip-card>
    <saved-quote-modal
      :requestNumber="requestNumber"
      :requestId="requestCreated._id"
      v-if="showQuoteModal && isSaved && !isPDF"
    ></saved-quote-modal>
    <saved-and-pdf-modal
      :requestNumber="requestNumber"
      :requestId="requestCreated._id"
      v-else-if="showQuoteModal && isSaved && isPDF"
      @modal-closed="returnToIPQoute"
    ></saved-and-pdf-modal>
    <ip-modal
      v-else
      width="500px"
      height="380px"
      v-model="showQuoteModal"
      :closeIcon="!isPDF"
    >
      <template>
        <template slot="header">
          <span data-e2e-type="ip-modal-title">Discard Quote</span>
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
            Discard unsaved quote changes!
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
    <ip-modal width="600px" v-model="showApproveModal">
      <template slot="header">
        <span data-e2e-type="ip-modal-title">Quote Approved!</span>
      </template>
      <div class="ip-modal-body">
        <i
          class="
            fas
            fa-check-circle
            ip-modal-body-icon ip-modal-body-icon__success
          "
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
          class="ip-modal-body__textarea mt-4"
          placeholder="Instructions and comments"
          v-model="instructionsAndComments"
        />
        <div class="ip-modal-body__subheader mt-4">Files</div>
        <ip-file-upload @file-upload="onFilesUploadApprove" class="mt-4" data-e2e-type="approve-files"/>
        <div class="ip-modal-body__controls">
          <ip-button data-e2e-type="approve-cancel" class="mr-4" @click.native="showApproveModal = false"
            >Cancel</ip-button
          >
          <ip-button data-e2e-type="approve-accept" type="filled" @click.native="approveQuote"
            >Submit and see your order</ip-button
          >
        </div>
      </div>
    </ip-modal>
  </div>
</template>

<script src="./nodb.js"></script>
<style src="../pdf-shared.scss" lang="scss"></style>
<style scoped lang="scss" src="../nodb/nodb.scss"></style>
