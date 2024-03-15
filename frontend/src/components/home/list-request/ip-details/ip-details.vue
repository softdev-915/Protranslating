<template>
  <div class="ip-details" :class="{'blur-loading-row': loading}">
    <div class="row align-items-center">
      <div class="col-6 col-md-3" data-e2e-type="ip-patent-service">
        <div class="row">
          <div class="col-2">
            <label>Service</label>
          </div>
        </div>
        <input
          data-e2e-type="ip-patent-service-input"
          type="text"
          :disabled="true"
          v-model.trim="patent.service"
          class="form-control"/>
      </div>
      <div class="col-6 col-md-3" data-e2e-type="ip-patent-database">
        <div class="row">
          <div class="col-2">
            <label>Category</label>
          </div>
        </div>
        <input
          data-e2e-type="ip-patent-database-input"
          type="text"
          :disabled="true"
          v-model.trim="patent.database"
          class="form-control"/>
      </div>
    </div>
    <template v-if="isNodb">
      <div class="row">
        <div class="col-12">
          <h6 class="font-weight-bold mt-4 ip-detail-header">Patent</h6>
        </div>
      </div>
      <div class="row align-items-center">
        <div
          class="col-6 col-md-3"
          data-e2e-type="ip-patent-application-number">
          <div class="row">
            <div class="col-12">
              <label>Filing Deadline</label>
            </div>
          </div>
          <input
            data-e2e-type="ip-patent-application-number-input"
            type="text"
            :disabled="true"
            :value="formatDate(patent.filingDeadline)"
            class="form-control"/>
        </div>
        <div
          class="col-6 col-md-3"
          data-e2e-type="ip-patent-publication-number"
          v-if="!isNodbOrder">
          <div class="row">
            <div class="col-12">
              <label>Source language</label>
            </div>
          </div>
          <input
            data-e2e-type="ip-patent-source-language-input"
            type="text"
            :disabled="true"
            v-model.trim="sourceLangNodb"
            class="form-control"/>
        </div>
      </div>
      <div class="row align-items-center">
        <div class="col-12 col-md-6" data-e2e-type="ip-patent-applicants-name">
          <div class="row">
            <div class="col-12">
              <label>Applicant's Name</label>
            </div>
          </div>
          <input
            data-e2e-type="ip-patent-applicants-name-input"
            type="text"
            :disabled="true"
            v-model.trim="patent.applicantName"
            class="form-control"/>
        </div>
      </div>
    <template v-if="canEdit">
      <template v-if="nodbType !== 'nodbOrder'">
        <div class="row">
          <div class="col-12">
            <h6 class="font-weight-bold mt-4 ip-detail-header">
              <span>Counts</span>
                <button v-if="!countsEditMode" class="ml-3" data-e2e-type="ip-edit-counts" @click="countsEditMode=true">
                  <i class="fas fa-pencil-alt"/>
                  <span class='ml-2'>Edit</span>
                </button>
                <template v-if="countsEditMode">
                  <button class="ml-3" @click="countsEditMode=false">
                    <i class="fas fa-times"/>
                    <span class='ml-2'>Cancel</span>
                  </button>
                  <button class="ml-3" data-e2e-type="ip-save-counts" @click="isCountsDialogOpened=true">
                    <i class="fas fa-save"/>
                    <span class='ml-2'>Save</span>
                  </button>
                </template>
            </h6>
          </div>
        </div>
        <div class="row">
          <div class="col-6">
            <div class="row">
              <div class="col-6 col-md-6">
                <label>Specification Word Count</label>
              </div>
              <div class="col-6 col-md-6">
                <input-wrapper
                  type="text"
                  data-e2e-type="ip-patent-specification-word-count"
                  v-model="currentPatent.specificationWordCount"
                  :disabled="!countsEditMode" />
              </div>
            </div>
          </div>
        </div>
        <div class="row">
          <div class="col-6">
            <div class="row">
              <div class="col-6 col-md-6">
                <label>Drawings Word Count</label>
              </div>
              <div class="col-6 col-md-6">
                <input-wrapper
                  type="text"
                  data-e2e-type="ip-patent-drawings-word-count"
                  v-model="currentPatent.drawingsWordCount"
                  :disabled="!countsEditMode" />
              </div>
            </div>
          </div>
        </div>
        <div class="row">
          <div class="col-6">
            <div class="row">
              <div class="col-6 col-md-6">
                <label>Number of Drawings</label>
              </div>
              <div class="col-6 col-md-6">
                <input-wrapper
                  type="text"
                  data-e2e-type="ip-patent-number-of-drawings"
                  v-model="currentPatent.numberOfDrawings"
                  :disabled="!countsEditMode" />
              </div>
            </div>
          </div>
        </div>
        <div class="row" v-if="nodbCounts.drawingsPageCount !== '0'">
          <div class="col-6">
            <div class="row">
              <div class="col-6 col-md-6">
                <label>Drawing Page Count</label>
              </div>
              <div class="col-6 col-md-6">
                <input-wrapper
                  type="text"
                  data-e2e-type="ip-patent-drawings-page-count"
                  v-model="currentPatent.drawingsPageCount"
                  :disabled="!countsEditMode" />
              </div>
            </div>
          </div>
        </div>
      </template>
      <template v-if="nodbType === 'nodbFiling'">
        <div class="row" v-if="nodbCounts.numberOfClaims !== '0'">
          <div class="col-6">
            <div class="row">
              <div class="col-6 col-md-6">
                <label>Number of Claims</label>
              </div>
              <div class="col-6 col-md-6">
                <input-wrapper
                  data-e2e-type="ip-patent-number-of-claims"
                  type="text"
                  :disabled="!countsEditMode"
                  v-model.trim="currentPatent.numberOfClaims"/>
              </div>
            </div>
          </div>
        </div>
        <div class="row">
          <div class="col-6">
            <div class="row">
              <div class="col-6 col-md-6">
                <label>Number of Independent Claims</label>
              </div>
              <div class="col-6 col-md-6">
                <input-wrapper
                  data-e2e-type="ip-patent-number-of-independent-claims"
                  type="text"
                  :disabled="!countsEditMode"
                  v-model.trim="currentPatent.numberOfIndependentClaims"/>
              </div>
            </div>
          </div>
        </div>
        <div class="row">
          <div class="col-6">
            <div class="row">
              <div class="col-6 col-md-6">
                <label>Total Number of Pages</label>
              </div>
              <div class="col-6 col-md-6">
                <input-wrapper
                  data-e2e-type="ip-patent-number-of-total-pages"
                  type="text"
                  :disabled="!countsEditMode"
                  v-model.trim="currentPatent.totalNumberOfPages"/>
              </div>
            </div>
          </div>
        </div>
        <div class="row">
          <div class="col-6">
            <div class="row">
              <div :class="nodbType === 'nodbOrder' ? 'col-12 col-md-12' : 'col-6 col-md-6'">
                <label>Claim Priority</label>
              </div>
              <div class="col-6 col-md-6">
                <input
                  data-e2e-type="ip-patent-claim-priority"
                  type="text"
                  :disabled="true"
                  v-model.trim="nodbCounts.claimPriority"
                  class="form-control"/>
              </div>
            </div>
          </div>
        </div>
      </template>
      </template>
    </template>
    <template v-else>
      <div class="row">
        <div class="col-12">
          <h6 class="font-weight-bold mt-4 ip-detail-header">Patent</h6>
        </div>
      </div>
      <div class="row align-items-center">
        <div
          class="col-6 col-md-3"
          data-e2e-type="ip-patent-application-number">
          <div class="row">
            <div class="col-12">
              <label>Patent Application Number</label>
            </div>
          </div>
          <input
            data-e2e-type="ip-patent-application-number-input"
            type="text"
            :disabled="true"
            v-model.trim="patent.patentApplicationNumber"
            class="form-control"/>
        </div>
        <div
          class="col-6 col-md-3"
          data-e2e-type="ip-patent-publication-number">
          <div class="row">
            <div class="col-12">
              <label>Patent Publication Number</label>
            </div>
          </div>
          <input
            data-e2e-type="ip-patent-publication-number-input"
            type="text"
            :disabled="true"
            v-model.trim="patent.patentPublicationNumber"
            class="form-control"/>
        </div>

        <div
          v-if="isEpo"
          class="col-6 col-md-3"
          data-e2e-type="ip-patent-validation-deadline">
          <div class="row">
            <div class="col-12">
              <label>Validation Deadline</label>
            </div>
          </div>
          <input
            data-e2e-type="ip-patent-validation-deadline-input"
            type="text"
            :disabled="true"
            v-model.trim="epo.validationDeadline"
            class="form-control"/>
        </div>
        <div
          v-else
          class="col-6 col-md-3"
          data-e2e-type="ip-patent-30-month-deadline">
          <div class="row">
            <div class="col-12">
              <label>30-month Deadline</label>
            </div>
          </div>
          <input
            data-e2e-type="ip-patent-30-month-deadline-input"
            type="text"
            :disabled="true"
            v-model.trim="thirtyMonthsDeadline"
            class="form-control"/>
        </div>
        <div v-if="!isIpOrder" class="col-6 col-md-3" data-e2e-type="ip-patent-source-language">
          <div class="row">
            <div class="col-12">
              <label>Source Language</label>
            </div>
          </div>
          <input
            data-e2e-type="ip-patent-source-language-input"
            type="text"
            :disabled="true"
            v-model.trim="patent.sourceLanguage"
            class="form-control"/>
        </div>
      </div>
      <div class="row align-items-center">
        <div class="col-12 col-md-6" data-e2e-type="ip-patent-applicants-name">
          <div class="row">
            <div class="col-12">
              <label>Applicant's Name</label>
            </div>
          </div>
          <input
            data-e2e-type="ip-patent-applicants-name-input"
            type="text"
            :disabled="true"
            v-model.trim="patent.applicantName"
            class="form-control"/>
        </div>
      </div>
      <template v-if="!isIpOrder && canReadCounts">
        <div class="row">
          <div class="col-12">
            <h6 class="font-weight-bold mt-4 ip-detail-header">
              <span> Counts </span>
              <template>
                <button v-if="!countsEditMode" class="ml-3" data-e2e-type="ip-edit-counts" @click="countsEditMode=true">
                  <i class="fas fa-pencil-alt"/>
                  <span class='ml-2'>Edit</span>
                </button>
                <template v-if="countsEditMode">
                  <button class="ml-3" @click="countsEditMode=false">
                    <i class="fas fa-times"/>
                    <span class='ml-2'>Cancel</span>
                  </button>
                  <button class="ml-3" data-e2e-type="ip-save-counts" @click="isCountsDialogOpened=true">
                    <i class="fas fa-save"/>
                    <span class='ml-2'>Save</span>
                  </button>
                </template>
              </template>
            </h6>
            <div class="row counts-header">
              <div class="col-md-6">
                <div class="row">
                  <div class="col-md-6">
                    <p class="font-weight-bold mb-0"> Field name </p>
                  </div>
                  <div class="col-md-6">
                    <p class="font-weight-bold mb-0"> User Entries </p>
                  </div>
                </div>
              </div>
              <div class="col-md-6">
                <div class="row">
                  <div class="col-md-6">
                    <p class="font-weight-bold mb-0"> Patent DB value </p>
                  </div>
                  <div class="col-md-6">
                    <p class="font-weight-bold mb-0 ml-1"> Match </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div v-if="isWIPO" class="row">
          <div class="col-6">
            <div class="row">
              <div class="col-6 col-md-6">
                <label>Abstract Word Count</label>
              </div>
              <div class="col-6 col-md-6">
                <input-wrapper
                  type="text"
                  data-e2e-type="ip-patent-abstract-word-count"
                  v-model="patentData.abstractWordCount"
                  :disabled="!canEdit || !countsEditMode" />
              </div>
            </div>
          </div>
          <div class="col-6">
            <div class="row">
              <div class="col-6 col-md-6">
                <input-wrapper
                  type="text"
                  data-e2e-type="ip-patent-abstract-word-count-original-value"
                  v-model="originalPatent.abstractWordCount"
                  :disabled="true" />
              </div>
              <div class="col-6 col-md-6 d-inline-block">
                <div
                  class='counts-match-badge form-control d-inline-block w-auto'
                  :class="{match: countsMatch('abstractWordCount')}"
                  data-e2e-type="abstract-word-count-match">
                  {{countsMatchText('abstractWordCount')}}
                </div>
              </div>
            </div>
          </div>
        </div>
        <div class="row">
          <div class="col-6">
            <div class="row">
              <div class="col-6 col-md-6">
                <label>Claims Word Count</label>
              </div>
              <div class="col-6 col-md-6">
                <input-wrapper
                  type="text"
                  data-e2e-type="ip-patent-claims-word-count"
                  v-model="patentData.claimsWordCount"
                  :disabled="!canEdit || !countsEditMode" />
              </div>
            </div>
          </div>
          <div class="col-6">
            <div class="row">
              <div class="col-6 col-md-6">
                <input-wrapper
                  type="text"
                  data-e2e-type="ip-patent-claims-word-count-original-value"
                  :value="getOriginalCount('claimsWordCount')"
                  :disabled="true" />
              </div>
              <div class="col-6 col-md-6 d-inline-block">
                <div
                  class='counts-match-badge form-control d-inline-block w-auto'
                  :class="{match: countsMatch('claimsWordCount')}"
                  data-e2e-type="claims-word-count-match">
                  {{countsMatchText('claimsWordCount')}}
                </div>
              </div>
            </div>
          </div>
        </div>
        <div class="row">
          <div class="col-6">
            <div class="row">
              <div class="col-md-6">
                <label>Description Word Count</label>
              </div>
              <div class="col-md-6">
                <input-wrapper
                  type="text"
                  data-e2e-type="ip-patent-description-word-count"
                  v-model="patentData.descriptionWordCount"
                  :disabled="!canEdit || !countsEditMode" />
              </div>
            </div>
          </div>
          <div class="col-6">
            <div class="row">
              <div class="col-6 col-md-6">
                <input-wrapper
                  type="text"
                  data-e2e-type="ip-patent-description-word-count-original-value"
                  :value="originalPatent.descriptionWordCount"
                  :disabled="true" />
              </div>
              <div class="col-6 col-md-6">
               <div
                  class='counts-match-badge form-control d-inline-block w-auto'
                  :class="{match: countsMatch('descriptionWordCount')}"
                  data-e2e-type="description-word-count-match">
                  {{countsMatchText('descriptionWordCount')}}
                </div>
              </div>
            </div>
          </div>
        </div>
        <div v-if="isTranslationOnlyService && isWIPO" class="row">
          <div class="col-6">
            <div class="row">
              <div class="col-6">
                <label>Number of Drawings</label>
              </div>
              <div class="col-md-6">
                <input-wrapper
                  type="text"
                  data-e2e-type="ip-patent-number-of-drawings"
                  v-model="patentData.numberOfDrawings"
                  :disabled="!canEdit || !countsEditMode" />
              </div>
            </div>
          </div>
          <div class="col-6">
            <div class="row">
              <div class="col-6 col-md-6">
                <input-wrapper
                  type="text"
                  data-e2e-type="ip-patent-number-of-drawings-original-value"
                  :value="originalPatent.numberOfDrawings"
                  :disabled="true" />
              </div>
              <div class="col-6 col-md-6">
                <div
                  class='counts-match-badge form-control d-inline-block w-auto'
                  :class="{match: countsMatch('numberOfDrawings')}"
                  data-e2e-type="number-of-drawings-match">
                  {{countsMatchText('numberOfDrawings')}}
                </div>
              </div>
            </div>
          </div>
        </div>
        <div v-if="!isTranslationOnlyService && isWIPO" class="row">
          <div class="col-6">
            <div class="row">
              <div class="col-6">
                <label>Number of Total Pages</label>
              </div>
              <div class="col-md-6">
                <input-wrapper
                  type="text"
                  data-e2e-type="ip-patent-number-of-total-pages"
                  v-model="patentData.totalNumberOfPages"
                  :disabled="!canEdit || !countsEditMode" />
              </div>
            </div>
          </div>
          <div class="col-6">
            <div class="row">
              <div class="col-6 col-md-6">
                <input-wrapper
                  type="text"
                  data-e2e-type="ip-patent-number-of-total-pages-original-value"
                  :value="originalPatent.numberTotalPages"
                  :disabled="true" />
              </div>
              <div class="col-6 col-md-6">
                <div
                  class='counts-match-badge form-control d-inline-block w-auto'
                  :class="{match: countsMatch('totalNumberOfPages')}"
                  data-e2e-type="total-number-of-pages-match">
                  {{countsMatchText('totalNumberOfPages')}}
                </div>
              </div>
            </div>
          </div>
        </div>
        <div v-if="!isTranslationOnlyService && isWIPO" class="row">
          <div class="col-6">
            <div class="row">
              <div class="col-6">
                <label>Number of Priority Applications</label>
              </div>
              <div class="col-md-6">
                <input-wrapper
                  type="text"
                  data-e2e-type="ip-patent-number-of-priority-applications"
                  v-model="patentData.numberOfPriorityApplications"
                  :disabled="!canEdit || !countsEditMode" />
              </div>
            </div>
          </div>
          <div class="col-6">
            <div class="row">
              <div class="col-6 col-md-6">
                <input-wrapper
                  type="text"
                  data-e2e-type="ip-patent-number-of-priority-applications-original-value"
                  :value="originalPatent.numberOfPriorityClaims"
                  :disabled="true" />
              </div>
              <div class="col-6 col-md-6">
                <div
                  class='counts-match-badge form-control d-inline-block w-auto'
                  :class="{match: countsMatch('numberOfPriorityApplications')}"
                  data-e2e-type="number-of-priority-applications-match">
                  {{countsMatchText('numberOfPriorityApplications')}}
                </div>
              </div>
            </div>
          </div>
        </div>
        <div v-if="!isTranslationOnlyService && isWIPO" class="row">
          <div class="col-6">
            <div class="row">
              <div class="col-6">
                <label>Number of Claims</label>
              </div>
              <div class="col-md-6">
                <input-wrapper
                  type="text"
                  data-e2e-type="ip-patent-number-of-claims"
                  v-model="patentData.numberOfClaims"
                  :disabled="!canEdit || !countsEditMode" />
              </div>
            </div>
          </div>
          <div class="col-6">
            <div class="row">
              <div class="col-6 col-md-6">
                <input-wrapper
                  type="text"
                  data-e2e-type="ip-patent-number-of-claims-original-value"
                  :value="originalPatent.numberOfClaims"
                  :disabled="true" />
              </div>
              <div class="col-6 col-md-6">
               <div
                  class='counts-match-badge form-control d-inline-block w-auto'
                  :class="{match: countsMatch('numberOfClaims')}"
                  data-e2e-type="number-of-claims-match">
                  {{countsMatchText('numberOfClaims')}}
                </div>
              </div>
            </div>
          </div>
        </div>
        <div class="row">
          <div class="col-6">
            <div class="row">
              <div class="col-6">
                <label>Drawings Page Count</label>
              </div>
              <div class="col-md-6">
                <input-wrapper
                  type="text"
                  data-e2e-type="ip-patent-drawings-page-count"
                  v-model="patentData.drawingsPageCount"
                  :disabled="!canEdit || !countsEditMode" />
              </div>
            </div>
          </div>
          <div class="col-6">
            <div class="row">
              <div class="col-6 col-md-6">
                <input-wrapper
                  type="text"
                  data-e2e-type="ip-patent-drawings-page-count-original-value"
                  :value="getOriginalCount('drawingsPageCount')"
                  :disabled="true" />
              </div>
              <div class="col-6 col-md-6">
                <div
                  class='counts-match-badge form-control d-inline-block w-auto'
                  :class="{match: countsMatch('drawingsPageCount')}"
                  data-e2e-type="drawings-page-count-match">
                  {{countsMatchText('drawingsPageCount')}}
                </div>
              </div>
            </div>
          </div>
        </div>
        <div v-if="!isTranslationOnlyService && isWIPO" class="row" >
          <div class="col-6">
            <div class="row">
              <div class="col-6">
                <label>Number of Independent Claims</label>
              </div>
              <div class="col-md-6">
                <input-wrapper
                  type="text"
                  data-e2e-type="ip-patent-number-of-independent-claims"
                  v-model="patentData.numberOfIndependentClaims"
                  :disabled="!canEdit || !countsEditMode" />
              </div>
            </div>
          </div>
        </div>
        <div class="row" v-if="!isTranslationOnlyService && !isWIPO">
          <div class="col-6">
            <div class="row">
              <div class="col-6">
                <label>Description Page Count</label>
              </div>
              <div class="col-md-6">
                 <currency-input
                  :disabled="!canEdit || !countsEditMode"
                  data-e2e-type="ip-patent-description-page-count"
                  class="form-control"
                  @input="onCountUpdate($event, 'descriptionPageCount')"
                  :value="patentData.descriptionPageCount"
                  :precision="0"
                  :currency="null"/>
              </div>
            </div>
          </div>
          <div class="col-6">
            <div class="row">
              <div class="col-6 col-md-6">
                <currency-input
                  :disabled="true"
                  data-e2e-type="ip-patent-description-description-page-count-original-value"
                  class="form-control"
                  :value="originalPatent.descriptionPageCount"
                  :precision="0"
                  :currency="null" />
              </div>
              <div class="col-6 col-md-6">
                <div
                  class='counts-match-badge form-control d-inline-block w-auto'
                  :class="{match: countsMatch('descriptionPageCount')}"
                  data-e2e-type="description-page-count-match">
                  {{countsMatchText('descriptionPageCount')}}
                </div>
              </div>
            </div>
          </div>
        </div>
        <div class="row" v-if="!isTranslationOnlyService && !isWIPO">
          <div class="col-6">
            <div class="row">
              <div class="col-6">
                <label>Number Of Claims</label>
              </div>
              <div class="col-md-6">
                 <currency-input
                  :disabled="!canEdit || !countsEditMode"
                  data-e2e-type="ip-patent-number-of-claims"
                  class="form-control"
                  @input="onCountUpdate($event, 'numberOfClaims')"
                  :value="patentData.numberOfClaims"
                  :precision="0"
                  :currency="null"/>
              </div>
            </div>
          </div>
          <div class="col-6">
            <div class="row">
              <div class="col-6 col-md-6">
                <currency-input
                  :disabled="true"
                  data-e2e-type="ip-patent-description-description-number-of-claims-original-value"
                  class="form-control"
                  :value="originalPatent.numberOfClaims"
                  :precision="0"
                  :currency="null" />
              </div>
              <div class="col-6 col-md-6">
               <div
                  class='counts-match-badge form-control d-inline-block w-auto'
                  :class="{match: countsMatch('numberOfClaims')}"
                  data-e2e-type="number-of-claims-match">
                  {{countsMatchText('numberOfClaims')}}
                </div>
              </div>
            </div>
          </div>
        </div>
        <div class="row">
          <div class="col-6">
            <div class="row">
              <div class="col-6 col-md-6">
                <label>Drawings Word Count</label>
              </div>
              <div class="col-6 col-md-6">
                <input-wrapper
                  type="text"
                  data-e2e-type="ip-patent-drawings-word-count"
                  v-model="patentData.drawingsWordCount"
                  :disabled="!canEdit || !countsEditMode" />
              </div>
            </div>
          </div>
        </div>
      </template>
    </template>
    <template v-if="isEpo && !isIpOrder">
      <div class="row">
        <div class="col-6 col-md-6 mt-3">
          <div class="row">
            <div class="col-6">
              <label>I need the text intended for Grant Claims translated in
                response to the intention to Grant notice 71(3)</label>
            </div>
            <div class="col-6">
              <span data-e2e-type="claims-translation-granted">{{ patent.claimsTranslationGranted ? 'Yes' : 'No' }}</span>
            </div>
          </div>
        </div>
      </div>
      <div class="row">
        <div class="col-6 col-md-6">
          <div class="row">
            <div class="col-6">
              <label>I need the granted claims translated into the following other
                official languages</label>
            </div>
            <div class="col-6">
              <template v-if="patent.claimsTranslationGranted">
                <label
                  :for="lang.isoCode"
                  v-for="lang in patent.otherLanguages"
                  :key="lang.isCode"
                  class="d-inline-flex align-items-center">
                  <input
                    type="checkbox"
                    class="mr-1"
                    :id="lang.isoCode"
                    disabled
                    :value="lang.isoCode"
                    checked/>
                  <span :data-e2e-type="`additional-lang-${lang.name}`"> {{ lang.name }} &nbsp; </span>
                </label>
              </template>
              <span v-else data-e2e-type="additional-lang-no">N/A</span>
            </div>
          </div>
        </div>
      </div>
      <div class="row">
        <div class="col-6 col-md-6">
          <div class="row">
            <div class="col-6">
              <label>Requested delivery date for claims translation</label>
            </div>
            <div class="col-6">
              <span v-if="patent.claimsTranslationGranted">{{
                patent.requestedDeliveryDateClaimsTranslation || 'N/A'
              }}</span>
              <span v-else>N/A</span>
            </div>
          </div>
        </div>
      </div>
      <div class="row">
        <div class="col-6 col-md-6">
          <div class="row">
            <div class="col-6">
              <label>Statury deadline for claims submission in</label>
            </div>
            <div class="col-6">
              <span data-e2e-type="statutory-deadline">{{ patent.statutoryDeadline || 'N/A' }}</span>
            </div>
          </div>
        </div>
      </div>
    </template>
    <div class="row align-items-center mt-2" v-if="!isTranslationOnlyService">
      <div class="col-12 col-md-6">
        <div class="row">
          <div class="col-12">
            <label>Annuity Quotation</label>
          </div>
        </div>
        <div class="ml-2 annuity-quotation-wrapper">
          <input
          data-e2e-type="annuity-quotation-required-readonly"
          type="checkbox"
          :checked="patent.isAnnuityQuotationRequired"
          :disabled="true">
          <span>Annuity Quotation Required</span>
        </div>
      </div>
    </div>
    <div v-if="!areCountriesEmpty" class="row">
      <div class="col-12">
        <h6 class="font-weight-bold mt-4 ip-detail-header">
          <span data-e2e-type="ip-countries-table-header">Countries</span>
          <template v-if="canEdit">
            <button
              v-if="!countryEditMode"
              class="ml-3"
              data-e2e-type="ip-countries-edit-button"
              @click="countryEditMode=true">
              <i class="fas fa-pencil-alt"/>
              <span class='ml-2'>Edit</span>
            </button>
            <template v-if="countryEditMode">
              <button class="ml-3" @click="countryEditMode=false">
                <i class="fas fa-times"/>
                <span class='ml-2'>Cancel</span>
              </button>
              <button
                class="ml-3"
                data-e2e-type="ip-countries-save-button"
                @click="isCountriesDialogOpened=true">
                <i class="fas fa-save"/>
                <span class='ml-2'>Save</span>
              </button>
            </template>
          </template>
        </h6>
      </div>
    </div>
    <div class="row" v-if="canEdit && !areCountriesEmpty">
      <div :class="{'col-6': (isEpo && isIpOrder || isNodbOrder || isWIPO && isOrder), 'col-12': !isIpOrder}">
        <!-- table with countries -->
        <table class="table table-bordered" data-e2e-type="ip-countries-table">
          <thead class="thead-light">
            <tr>
              <th
                v-for="(countryCol, countryIndex) in countryTableColumns"
                scope="col"
                :key="countryIndex">
                {{ countryCol.name }}
              </th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(country, countryIndex) in patentData.countries" :key="country._id">
              <td
                v-for="(countryCol, countryColIndex) in countryTableColumns"
                :key="countryColIndex">
                <div class="financial-field d-inline-flex" v-if="countryEditMode && isFinancialColumn(countryCol.prop)">
                  <span>{{quoteCurrencyIsoCode}}</span>
                  <currency-input
                    :disabled="!canEdit || !countryEditMode"
                    :data-e2e-type="`${countryCol.name} ${country.name}`"
                    class="form-control"
                    :value="countryFinancialPropertyValue(country, countryCol)"
                    @input="onCountryFeeUpdate($event, countryIndex, countryCol.prop)"
                    :precision="2"
                    :currency="null" />
                </div>
                <span v-else-if="isCurrencyField(countryCol.prop)">
                  {{ getCurrency(country, countryCol)}}
                  {{ countryFinancialPropertyText(country, countryCol) }}
                </span>
                <span v-else>
                  {{countryProperty(country, countryCol) || 'N/A' }}
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
    <div v-else class="col-12">
      <span data-e2e-type="ip-countries-table-readonly"> {{this.countriesNames}} </span>
    </div>
    <div v-if="canSeeClaimsTranslationFees" class="row">
      <div class="col-12">
        <h6 class="font-weight-bold mt-4 ip-detail-header">
          EP Claims for 71(3)
        </h6>
      </div>
    </div>
    <div class="row" v-if="canSeeClaimsTranslationFees">
      <div class="col-6">
        <table class="table table-bordered">
          <thead>
            <tr>
              <th scope="col">Language</th>
              <th scope="col">Translation Fee</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="fee in patent.claimsTranslationFees" :key="fee._id">
              <td>{{ fee.language }}</td>
              <td>
                {{ quoteCurrencyIsoCode }}
                {{ countryFinancialPropertyText(fee, { prop: 'calculatedFee' }) }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
    <div v-if="!isIpOrder && canEdit" class="row">
      <div class="col-12">
        <div class="d-flex flex-row-reverse">
          <h6 class="font-weight-bold" data-e2e-type="ip-total-amount">{{ formatNumber(patentTotal) }}</h6>
          <h6 class="mr-2" data-e2e-type="ip-total">TOTAL: {{quoteCurrencyIsoCode}}</h6>
        </div>
      </div>
    </div>
    <patent-confirm-dialog
      data-e2e-type="ip-counts-modal"
      modal-type="counts"
      v-model="isCountsDialogOpened"
      @confirm="submitCountsChanges"
      @cancel="isCountsDialogOpened=false">
      <div v-if="isTranslationOnlyService" class="text-center">
        <p>This action will update the translation fees for all the countries.</p>
        <p>Would you like to continue?</p>
      </div>
      <div v-else class="text-center">
        <p> This action will update the translation fees. The counts fields will remain unchanged.</p>
        <p>Would you like to continue?</p>
      </div>
    </patent-confirm-dialog>
    <patent-confirm-dialog
      data-e2e-type="ip-countries-modal"
      modal-type="countries"
      v-model="isCountriesDialogOpened"
      @confirm="forceUpdatePatentFee"
      @cancel="isCountriesDialogOpened=false">
      <div v-if="isTranslationOnlyService" class="text-center">
        <p>This action will update the translation fees. The counts fields will remain unchanged</p>
        <p>Would you like to continue?</p>
      </div>
      <div v-else class="text-center">
        <p>This action will update the total fees for all the countries. The counts fields will remain unchanged.</p>
        <p>Would you like to continue?</p>
      </div>
    </patent-confirm-dialog>
  </div>
</template>

<style src="./ip-details.scss" lang="scss" scoped></style>
<script src="./ip-details.js"></script>
