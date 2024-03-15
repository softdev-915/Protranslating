<template>
  <div class="pts-grid-edit-modal drop-zone-trigger position-relative">
    <div>
      <div slot="default"
        data-e2e-type="opportunity-edit-body"
        :class="{'blur-loading-row': loadingPage || dragging}"
        ref="dropZoneTrigger">
        <div ref="dropZone" class="container full drop-zone-container" :class="dragAndDropClasses">
          <div class="row align-items-start">
            <div class="col drop-zone align-self-center">
              <i class="fas fa-cloud-upload" aria-hidden="true"></i> Drop files here
            </div>
          </div>
        </div>
        <div id="opportunityEntityForm" class="container-fluid" :class="{'pts-non-editable-form': !canCreateOrEdit}">
          <div class="row">
            <div class="col-12 pts-font-bold">Opportunity details</div>
          </div>
          <div class="row form-section">
            <!-- Opportunity details -->
            <div class="col-12 col-md-6">
              <div class="row align-items-center" v-show="requestEntity.no">
                <label class="col-md-4 col-4 form-check-label">Opportunity No.</label>
                <div class="col-8" data-e2e-type="opportunity-no">{{requestEntity.no}}</div>
              </div>
              <div class="row align-items-center" v-if="!canCreateOrEdit">
                <label class="col-md-4 col-12 form-check-label">Title</label>
                <div class="col-8">{{requestEntity.title}}</div>
              </div>
              <div v-else class="row align-items-center" :class="{ 'has-danger': errors.has('title') }">
                <label class="col-md-4 col-12 form-check-label">
                  <span class="pts-required-field">*</span> Title</label>
                <div class="col-md-8 col-12">
                  <input type="text" v-validate="'required'" data-e2e-type="opportunity-title-input" v-model.trim="requestEntity.title" class="form-control" name="title">
                  <span class="form-control-feedback" v-show="errors.has('title')">{{ errors.first('title') }}</span>
                </div>
              </div>
              <div class="row align-items-center" v-if="canCreateOrEdit">
                <label class="col-12 col-md-4 form-check-label">
                  <span class="pts-required-field">* </span>Opportunity Status
                </label>
                <div class="col-12 col-md-8">
                  <simple-basic-select
                    v-if="canCreateOrEdit"
                    v-model="requestEntity.status"
                    :options="opportunityStatusSelectOptions"
                    title="Opportunity status selector"
                    data-e2e-type="opportunity-status-selector"
                  />
                </div>
              </div>
              <div class="row align-items-center" v-if="!canCreateOrEdit">
                <label class="col-md-4 col-12 form-check-label">Request Status</label>
                <div class="col-8">{{requestEntity.status}}</div>
              </div>
              <div class="row align-items-center p-0" v-if="hasLostStatus">
                <div class="col-12 offset-sm-1">
                  <div class="row align-items-center">
                    <div class="col-12 col-md-3">
                      <span class="pts-required-field">* </span>Lost reason
                    </div>
                    <div class="col-12 col-md-8">
                      <simple-basic-select
                        v-if="canCreateOrEdit"
                        data-e2e-type="opportunity-lost-reason-selector"
                        v-model="requestEntity.lostReason"
                        :options="lostReasonSelectOptions"/>
                      <div v-else>{{ requestEntity.lostReason }}</div>
                    </div>
                  </div>
                </div>
              </div>
              <div class="row align-items-center" v-if="!isNewRecord && hasWonStatus && requestEntity.wonOnDate">
                <div class="col-12 col-md-3 offset-sm-1">
                  Won on
                </div>
                <div class="col-12 col-md-8" data-e2e-type="opportunity-won-on-date">
                  {{ requestEntity.wonOnDate | localDateTime('MM-DD-YYYY HH:mm') }}
                </div>
              </div>
            </div>

            <div class="col-12 col-md-6">
              <div class="row align-items-center" v-if="canCreateOrEdit">
                <label class="col-12 col-md-4 form-check-label">
                  <span class="pts-required-field">*</span> Expected close date
                </label>
                <div class="col-12 col-md-8" :class="{'has-danger': !isValidExpectedCloseDate}">
                  <div class="input-group">
                    <utc-flatpickr
                      data-e2e-type="opportunity-expected-close-date-input"
                      v-model="requestEntity.expectedCloseDate"
                      :config="datepickerOptions"
                      :format="'YYYY-MM-DD HH:mm'"
                      class="form-control provider-task-flatpick"/>
                    <span class="input-group-addon"><i class="fas fa-calendar"></i></span>
                  </div>
                  <span
                    v-show="!isValidExpectedCloseDate"
                    class="form-control-feedback"
                    data-e2e-type="expected-close-date-error-message">Expected close date cannot be in the past</span>
                </div>
              </div>

              <div class="row align-items-center">
                <label class="col-12 col-md-4 form-check-label">
                  <span class="pts-required-field">*</span> Probability &#37;
                </label>
                <div class="col-12 col-md-8">
                  <simple-basic-select
                    v-if="canCreateOrEdit"
                    v-model.number="requestEntity.probability"
                    :options="probabilitySelectOptions"
                    title="Probability selector"
                    data-e2e-type="probability-selector"/>
                  <div v-else>{{ requestEntity.probability }}</div>
                </div>
              </div>

              <div class="row align-items-center" v-if="requestEntity.salesRep">
                <label class="col-4 col-md-4 form-check-label">Sales rep</label>
                <div class="col-8 col-md-6" data-e2e-type="opportunity-sales-rep">
                  {{ salesRepName }}
                </div>
              </div>

              <div class="row align-items-center">
                <label class="col-12 col-md-4 form-check-label">
                  <span class="pts-required-field">*</span> Estimated $ Value
                </label>
                <div class="col-12 col-md-8">
                  <currency-input
                    v-model="requestEntity.estimatedValue"
                    aria-label="Opportunity estimated value"
                    :class="moneyInputClass"
                    data-e2e-type="opportunity-estimated-value-input">
                  </currency-input>
                </div>
              </div>
            </div>
          </div>

          <!-- Contact details -->
          <div class="row p-0">
            <div class="col-12 pts-font-bold">Contact details</div>
          </div>
          <div class="row form-section" data-e2e-type="company-container">
            <label class="col-12 col-md-2" for="company">
              <span data-e2e-type="company" class="pts-required-field">*</span> Company
            </label>
            <div class="col-10" v-if="canCreateOrEdit && isNewRecord">
              <company-ajax-basic-select
                id="company"
                :fetch-on-created="false"
                data-e2e-type="company-select"
                :selected-option="selectedCompany"
                :required="true"
                :select="'_id name parentCompany mandatoryRequestContact'"
                @select="onCompanySelected" />
            </div>
            <div class="col-12 col-md-6" data-e2e-type="company-read-only" v-else>
              {{ companyHierarchy}}
            </div>
          </div>
          <div
            class="row"
            :class="{'blur-loading-row' : loadingContacts}"
            data-e2e-type="contact-container"
            v-if="canCreateOrEdit">
            <label class="col-12 col-md-2 form-check-label">
              <span class="pts-required-field">*</span>
              Contact
            </label>
            <div class="col-12 col-md-10" id="contactSelect">
              <contact-select
                v-model="contactSelected"
                :companyId="companyId"
                @contacts-loaded="onContactLoaded($event)"></contact-select>
            </div>
          </div>
          <div class="row align-items-center" v-else>
            <label class="col-12 col-md-4 form-check-label">Contact</label>
            <div class="col-12 col-md-8">
              {{ contactName }}
            </div>
          </div>
          <div class="row align-items-center" :class="{'blur-loading-row' : loadingContacts}" data-e2e-type="secondary-contact-container" v-if="canCreateOrEdit">
            <label class="col-12 col-md-2 form-check-label">Secondary contacts</label>
            <div class="col-12 col-md-10" data-e2e-type="secondary-contacts-multi-select">
              <multi-select
                :selected-options="selectedSecondaryContacts"
                :options="availableSecondaryOptions"
                :disabled="!canCreateOrEdit"
                title="Secondary contact list"
                @select="onSecondaryContactSelected">
              </multi-select>
            </div>
          </div>
          <div class="row align-items-center" v-else>
            <label class="col-12 col-md-4 form-check-label">Secondary Contacts</label>
            <div class="col-12 col-md-8">
              {{ secondaryContactsName }}
            </div>
          </div>
          <!-- Language details -->
          <div class="row">
            <div class="col-12 pts-font-bold">Language selection</div>
          </div>
          <div class="row language-section">
            <div class="col-12 col-md-6">
              <div class="container">
                <div class="row">
                  <label class="col-8 form-check-label">
                    <span class="pts-required-field">*</span> Translate From
                  </label>
                  <div class="col-8" v-if="!canCreateOrEdit">{{srcLang.text}}</div>
                </div>
                <language-select
                  :customClass="'col-12'"
                  data-e2e-type="language-translate-from-select"
                  :empty-option="{ text: 'English', value: { name: 'English', isoCode: 'ENG' } }"
                  v-model="requestEntity.srcLang"
                  title="Language list"
                  placeholder="Select source language"
                  languageList="languageOptions">
                </language-select>
              </div>
            </div>
            <div class="col-12 col-md-6">
              <div class="container">
                <div class="row">
                  <label class="col-8 form-check-label">
                    <span class="pts-required-field">*</span> Translate To
                  </label>
                </div>
                <div class="row pts-select" id="translateTo">
                  <div class="col-12" v-if="canCreateOrEdit">
                    <language-multi-select
                      v-model="requestEntity.tgtLangs"
                      :excludedLanguages="[requestEntity.srcLang]"
                      data-e2e-type="language-translate-to-multi-select"
                      title="Language list"
                      placeholder="Select target languages"
                      languageList="languageOptions">
                    </language-multi-select>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div class="row">
            <label class="col-12 form-check-label">
              <span class="pts-required-field">*</span> Opportunity notes
            </label>
          </div>
          <div class="row">
            <div class="col-12">
              <div class="container-fluid pts-no-padding">
                <div class="editor-container" data-e2e-type="opportunity-notes-container">
                  <rich-text-editor :disabled="!canCreateOrEdit" v-model.trim="requestEntity.notes" placeholder="Notes"></rich-text-editor>
                </div>
              </div>
            </div>
          </div>
          <div class="row mt-3">
            <div class="col-12">
              <div class="pts-font-bold pull-left">
                File upload
              </div>
              <div class="pull-right">
                <button
                  data-e2e-type="download-all-src-file"
                  v-show="!downloadingSrcFiles"
                  @click="downloadSourceFilesZip($event)"
                  class="mr-2 pts-clickable btn opportunity-upload-document-button">Download All Source Files <i class="fas fa-file-archive-o"></i>
                </button>
                <span class="mt-2 mr-2 saving-spinner" v-show="downloadingSrcFiles"><i class="fas fa-spinner fa-pulse fa-fw"></i></span>
                <iframe-download v-if="hasSourceFiles" ref="srcFilesIframeDownload" @download-finished="onSrcFilesDownloadFinished()" @download-error="onIframeDownloadError($event)"></iframe-download>
                <button v-if="canCreateOrEdit" class="pts-clickable btn opportunity-upload-document-button" @click.prevent="fireUpload($event)" data-e2e-type="opportunity-upload-source-file"> Add Source File <i class="fas fa-plus"></i> </button>
                <input id="addFile" ref="fileUpload" multiple type="file" name="files" @change="onFileUpload($event)" style="display: none">
              </div>
            </div>
          </div>
          <div class="row">
            <div class="col-12" data-e2e-type="opportunity-source-files">
              <div class="pts-font-bold pb-2">
                Source documents
              </div>
              <request-files
                ref="documentProspect"
                :entityId="requestEntity._id"
                :service="service"
                :documents="sourceDocuments"
                :visibleColumns="visibleDocumentColumns"
                :companyId="companyId"
                :canEdit="canCreateOrEdit"
                :urlResolver="documentUrlResolver"
                @document-delete="onDocumentDelete($event)"
                @marked-reference="onDocumentMarkedReference($event)">
              </request-files>
            </div>
          </div>
        </div>
      </div>
      <div slot="modal-footer" class="form-actions">
        <button class="btn btn-secondary pull-right" id="close" v-show="!saving" @click="close">Close</button>
        <button class="btn btn-primary pull-right mr-2" data-e2e-type="opportunity-save-button"
                :disabled="!isValid"
                @click="save"
                v-show="!saving"
                v-if="canCreateOrEdit">Save
        </button>
        <button class="btn btn-primary pull-right mr-2"
                data-e2e-type="opportunity-create-request-button"
                v-if="canCreateOrEditRequests && !isNewRecord"
                @click="createRequest">Create Request
        </button>
        <span class="pull-right saving-spinner" v-show="saving"><i class="fas fa-spinner fa-pulse fa-fw"></i></span>
      </div>
    </div>
  </div>
</template>

<script src="./opportunity-edit.js"></script>

<style lang="scss" scoped src="./opportunity-edit.scss"></style>
