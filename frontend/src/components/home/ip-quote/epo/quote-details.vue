<template>
  <ip-card data-e2e-type='ip-quote-details' class="ml-3 quote-details-card">
      <div class="ip-card__header" data-e2e-type="ip-quote-details-title">
        <span>{{title}}</span>
      </div>
      <div class="ip-card__detail">
        <div class="detail__info align-items-start">
          <div class="record d-flex flex-column align-items-start" data-e2e-type="ip-quote-details-service">
            <span class="record__header">Service</span>
            <span>{{ service }}</span>
          </div>
          <div class="record d-flex flex-column align-items-start" data-e2e-type="ip-quote-details-category">
            <span class="record__header">Category</span>
            <span>{{ database }}</span>
          </div>
        </div>
        <h5 v-if="epo._id" class="record-header mt-3 mb-3" data-e2e-type="ip-quote-details-patent-header">Patent</h5>
        <div v-if="epo._id" class="detail__info">
          <div class="record-wide d-flex flex-column align-items-start" data-e2e-type="ip-quote-details-patent">
            <span class="record-wide__header">Patent title</span>
            <span>{{ epo.title }}</span>
          </div>
        </div>
        <div v-if="epo._id" class="detail__info mt-3">
          <div class="record d-flex flex-column align-items-start" data-e2e-type="ip-quote-details-requested-by">
            <span class="record__header">Requested by</span>
            <span>{{ requestedBy }}</span>
          </div>
          <div class="record d-flex flex-column align-items-start" data-e2e-type="ip-quote-details-sales-representative">
            <span class="record__header">Sales Representative</span>
            <span>
              <a :href="`mailto:${salesRepEmail}`" target="_blank">
                <i class="fas fa-envelope" style="color: #408dca" />
              </a>
              <span class="ml-2">{{ salesRep }}</span></span
            >
          </div>
        </div>
        <template v-if="isPatentDetails">
          <div class="detail__info align-items-start mt-3">
            <div class="record d-flex flex-column align-items-start" data-e2e-type="ip-quote-details-application-number">
              <span class="record__header">Patent Application Number</span>
              <span>{{ epo.patentApplicationNumber }}</span>
            </div>
            <div class="record d-flex flex-column align-items-start" data-e2e-type="ip-quote-details-publication-number">
              <span class="record__header">Patent Publication Number</span>
              <span>{{ epo.patentPublicationNumber }}</span>
            </div>
          </div>
          <div v-if="isDetailsFilled" class="detail__info align-items-start mt-3">
            <div class="record d-flex flex-column align-items-start" data-e2e-type="ip-quote-details-requested-del-date">
              <span class="record__header">Requested Delivery Date</span>
              <span>{{ formatDate(epo.requestedDeliveryDate) }}</span>
            </div>
            <div class="record d-flex flex-column align-items-start" data-e2e-type="ip-quote-details-ref-number">
              <span class="record__header">Reference Number</span>
              <span>{{ epo.referenceNumber  || "N/A" }}</span>
            </div>
          </div>
          <div class="detail__info align-items-start mt-3">
            <div class="record d-flex flex-column align-items-start w-100 mw-100" data-e2e-type="ip-quote-details-applicant">
              <span class="record__header">Applicant(s)</span>
              <span v-html="formatApplicants(epo.applicantName)"></span>
            </div>
          </div>
          <div class="detail__info align-items-start mt-3">
            <div class="record d-flex flex-column align-items-start" data-e2e-type="ip-quote-details-validation-deadline">
              <span class="record__header">Validation Deadline</span>
              <span>{{ validationDeadline }}</span>
            </div>
          </div>
        </template>
        <template v-if="!isOrder && isDetailsFilled">
          <h5 class="record-header mt-3 mb-3"  data-e2e-type='ip-quote-details-counts-header'>
            Counts
          </h5>
          <div class="detail__info mt-3">
            <div class="record d-flex flex-column align-items-start" data-e2e-type="ip-quote-details-description-word-count">
              <span class="record__header">Description Word Count</span>
              <span>{{ formatNumber(epo.descriptionWordCount) }}</span>
            </div>
            <div class="record d-flex flex-column align-items-start" data-e2e-type="ip-quote-details-drawings-word-count">
              <span class="record__header">Drawings Word Count</span>
              <span>{{ formatNumber(epo.drawingsWordCount) || 0 }}</span>
            </div>
          </div>
          <div class="detail__info mt-3">
            <div class="record d-flex flex-column align-items-start" data-e2e-type="ip-quote-details-claims-word-count">
              <span class="record__header">Claims Word Count</span>
              <span>{{ formatNumber(epo.claimWordCount) }}</span>
            </div>
            <div class="record d-flex flex-column align-items-start" data-e2e-type="ip-quote-details-drawings-page-count">
              <span class="record__header">Number of Drawing Pages</span>
              <span>{{ formatNumber(epo.drawingsPageCount) }}</span>
            </div>
          </div>
          <div class="detail__info mt-3" v-if="!translationOnly">
            <div class="record d-flex flex-column align-items-start" data-e2e-type="ip-quote-details-description-page-count">
              <span class="record__header">Description Page Count</span>
              <span>{{ formatNumber(epo.descriptionPageCount) }}</span>
            </div>
            <div class="record d-flex flex-column align-items-start" data-e2e-type="ip-quote-details-claims-page-count">
              <span class="record__header">Claims Page Count</span>
              <span>{{ formatNumber(epo.claimsPageCount) }}</span>
            </div>
          </div>
          <div class="detail__info mt-3" v-if="!translationOnly">
            <div class="record d-flex flex-column align-items-start" data-e2e-type="ip-quote-details-number-of-claims">
              <span class="record__header">Number of Claims</span>
              <span>{{ formatNumber(epo.numberOfClaims) }}</span>
            </div>
          </div>
        </template>
        <template v-if="translationOnly && isEPGrantedClaimsTranslation">
          <h5 class="record-header mt-3 mb-3" data-e2e-type="ip-quote-details-claimed-translation-header">
            EP Granted Claims Translation
          </h5>
          <div class="detail__info mt-3">
            <div class="record d-flex flex-column align-items-start w-100 mw-100" data-e2e-type="ip-quote-details-claimed-translation">
              <span class="record__header">I need the text intended for Grant claims translated in response to the intention to Grant notice 71(3)</span>
              <span>{{ claimsTranslationGrantedText }}</span>
            </div>
          </div>
          <template v-if="claimsTranslationGranted && isClaimsTranslationGrantedProvided">
            <div class="detail__info mt-3">
              <div class="record d-flex flex-column align-items-start w-100 mw-100" data-e2e-type="ip-quote-details-other-languages">
                <span class="record__header">I need the granted claims translated into the following other official languages</span>
                <span>{{ otherLanguagesText }}</span>
              </div>
            </div>
            <div class="detail__info mt-3">
              <div class="record d-flex flex-column align-items-start w-100 mw-100" data-e2e-type="ip-quote-details-claimed-translation-delivery-date">
                <span class="record__header">Requested Delivery Date for claims translation</span>
                <span>{{ claimsTranslationDeliveryDate }}</span>
              </div>
            </div>
            <div class="detail__info mt-3">
              <div class="record d-flex flex-column align-items-start w-100 mw-100" data-e2e-type="ip-quote-details-statutory-deadline">
                <span class="record__header">Statutory deadline for claims submission in response to 71(3) notice</span>
                <span>{{ statutoryDeadlineDate }}</span>
              </div>
            </div>
          </template>
        </template>
        <template v-if="isCountriesSelected">
          <h5  class="record-header mt-3 mb-3" data-e2e-type="ip-quote-details-countries-header">
          Countries
          </h5>
          <div class="detail__info mt-3">
            <div class="record-wide d-flex flex-column align-items-start" data-e2e-type="ip-quote-details-countries">
              <span>{{ countryNames }}</span>
            </div>
          </div>
        </template>
      </div>
    </ip-card>
</template>
<script src='./quote-details.js'> </script>
<style scoped lang="scss" src="./quote-details.scss"></style>
