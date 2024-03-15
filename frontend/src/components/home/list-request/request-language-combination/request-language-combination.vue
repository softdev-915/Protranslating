<template>
  <div
    data-e2e-type="request-language-combination"
    ref="languageCombinationDropZoneTrigger"
    class="mt-2 language-combination"
    :class="{'blur-loading': dragging }">
      <iframe-download
        v-if="canDownloadSourceFiles"
        ref="iframeLanguageCombination"
        @download-finished="downloadingFiles = false"
        @download-error="onIframeDownloadError($event)">
      </iframe-download>
    <div class="row m-0 p-0 pt-2">
      <div ref="languageCombinationDropZone" class="container drop-zone-container" :class="dragAndDropClasses">
        <div class="row align-items-start">
          <div class="col drop-zone align-self-center">
            <i class="fas fa-cloud-upload" aria-hidden="true"></i> Drop files here
          </div>
        </div>
      </div>
      <div class="col-12 col-md-6" v-if="canReadLanguageCombinations">
        <confirm-dialog
          data-e2e-type="delete-language-combination-confirmation-dialog"
          ref="deleteLanguageCombinationConfirmationDialog"
          :container-class="'medium-dialog'"
          :confirmation-title="'WARNING'"
          :confirmation-message="'You are deleting the language section and all source documents attached it. This action cannot be reversed once you save this request. Are You sure?'"
          @confirm="onDeleteLanguageCombinationConfirmation">
        </confirm-dialog>
        <confirm-dialog
          data-e2e-type="delete-document-confirmation-dialog"
          ref="deleteDocumentConfirmationDialog"
          :show-remember-option="true"
          :container-class="'small-dialog'"
          :confirmation-title="'WARNING'"
          :confirmation-message="'This action cannot be reversed. Are You sure?'"
          @confirm="onDeleteDocumentConfirmation">
        </confirm-dialog>
        <div class="container-fluid p-0">
          <div class="row pts-select pl-0 pb-3">
            <label class="col-11 pl-3" :class="{'form-check-label': canEditAll }">
              <span class="pts-required-field">*</span> Translate From
            </label>
            <div
              class="col-11"
              v-if="!canEditAll"
              data-e2e-type="source-language-read-only">
              {{ srcLangList }}
            </div>
            <div class="col-11 pt-2 pl-0 pr-0" v-if="canEditAll">
              <language-select
                v-if="hasMultipleTargetLanguages"
                v-model="srcLangs"
                :is-required="true"
                :class="{ 'has-danger': !hasSrcLangs }"
                :excluded-languages="excludedSourceLanguages"
                :options="languages"
                :fetch-on-created="false"
                :non-removable-values="nonRemovableSrcLangs"
                @restricted-option-removal="() => $emit('restricted-option-removal', { language: true })"
                :customFilteredOptions="customFilter"
                :is-disabled="isWorkflowInEditMode || isCatImportRunning"
                data-e2e-type="source-language-single-select"
                title="Language list"
                placeholder="Select source language">
              </language-select>
              <language-multi-select
                v-else
                data-e2e-type="source-language-multi-select"
                :class="{ 'has-danger': !hasSrcLangs }"
                v-model="srcLangs"
                :fetch-on-created="false"
                :options="languages"
                :excluded-languages="excludedSourceLanguages"
                :non-removable-values="nonRemovableSrcLangs"
                @restricted-option-removal="() => $emit('restricted-option-removal', { language: true })"
                :customFilteredOptions="customFilter"
                :is-disabled="isWorkflowInEditMode || isCatImportRunning"
                title="Language list"
                placeholder="Select source languages">
              </language-multi-select>
            </div>
            <div
              class="col-1 p-0 mt-2 action-buttons"
              :class="{'action-buttons-read-only': !canEditAll }">
              <div class="row pt-0">
                <div class="col-12">
                  <button
                    :disabled="!canEditAll || isWorkflowInEditMode"
                    data-e2e-type="add-language-combination-button"
                    @click="addLanguageCombination"
                    class="btn fas fa-plus">
                  </button>
                </div>
                <div class="col-12">
                  <button
                    v-if="index != 0"
                    :disabled="isSingleLanguageCombination || !canEditAll || isWorkflowInEditMode"
                    data-e2e-type="delete-language-combination-button"
                    @click="deleteLanguageCombination"
                    class="btn fas fa-times"
                    :class="{'has-danger': hasDanger}">
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div class="col-12 col-md-6" v-if="canReadLanguageCombinations">
        <div class="container-fluid pr-2">
          <div class="row">
            <label class="col-11 pl-3" :class="{'form-check-label': canEditAll }">
              <span class="pts-required-field">*</span> Translate To
            </label>
            <div
              class="col-11"
              data-e2e-type="target-language-read-only"
              v-if="!canEditAll">
              {{ tgtLangList }}
            </div>
          </div>
          <div class="row pts-select" v-if="canEditAll">
            <div class="w-100">
              <language-select
                v-if="hasMultipleSourceLanguages"
                v-model="tgtLangs"
                :class="{ 'has-danger': !hasTgtLangs }"
                :excluded-languages="excludedTargetLanguages"
                :fetch-on-created="false"
                :options="languages"
                :non-removable-values="nonRemovableTgtLangs"
                :is-disabled="isWorkflowInEditMode || isCatImportRunning"
                data-e2e-type="target-language-single-select"
                title="Language list"
                placeholder="Select target language"
                :customFilteredOptions="customFilter"
                @restricted-option-removal="() => $emit('restricted-option-removal', { language: true })">
              </language-select>
              <language-multi-select
                v-else
                :class="{ 'has-danger': !hasTgtLangs }"
                v-model="tgtLangs"
                :excluded-languages="excludedTargetLanguages"
                :options="languages"
                :fetch-on-created="false"
                :non-removable-values="nonRemovableTgtLangs"
                :customFilteredOptions="customFilter"
                @restricted-option-removal="() => $emit('restricted-option-removal', { language: true })"
                :is-disabled="isWorkflowInEditMode || isCatImportRunning"
                data-e2e-type="target-language-multi-select"
                title="Language list"
                placeholder="Select target languages">
              </language-multi-select>
            </div>
          </div>
        </div>
      </div>
      <div class="col-12 mt-2" v-if="!languageCombination._id && canReadLanguageCombinations">
        <input
          :id="`preferred-language-combination-${index}`"
          type="checkbox"
          aria-label="Set Preferred Language Combination "
          data-e2e-type="preferred-language-combination"
          :checked="languageCombination.preferredLanguageCombination"
          @input="onSelectedPreferredLanguageCombination">
        <label :for="`preferred-language-combination-${index}`" class="p-0"> Set preferred Language Combination </label>
      </div>
      <div class="col-12 pt-0">
        <div class="row pt-0 pb-3">
          <div v-if="isRunCatImportButtonVisible" class="col-12 col-md-3 col-lg-6">
            <div class="text-md-left text-center pb-3 pb-md-0">
              <button
                  class="btn btn-outline-success"
                  data-e2e-type="run-cat-import"
                  :disabled="!canRunCatImport"
                  @click="openCatImportModal">
                <i class="fas fa-play fa-fw"></i>
                Run CAT Import
              </button>
            </div>
          </div>
          <div
              class="col-12"
              :class="{'col-md-9 col-lg-6': isRunCatImportButtonVisible}">
            <div class="text-md-right text-center">
              <button
                data-e2e-type="download-all-src-file"
                v-if="canDownloadSourceFilesAsZip && languageCombination._id"
                v-show="!downloadingFiles && hasDocuments"
                :disabled="isWorkflowInEditMode"
                @click="downloadSourceFiles($event)"
                class="mr-2 pts-clickable btn btn-outline-primary">
                <i class="fas fa-folder-o" aria-hidden="true"></i>
                Download All Source Files
              </button>
              <span class="mr-2 saving-spinner" v-show="downloadingFiles"><i class="fas fa-spinner fa-pulse fa-fw"></i></span>
              <button
                v-if="canAddSourceFiles"
                class="pts-clickable btn btn-outline-primary"
                :disabled="isWorkflowInEditMode"
                @click.prevent="fireUpload($event)"
                data-e2e-type="request-upload-source-file">
                <i class="fas fa-plus-circle" aria-hidden="true"></i>
                Browse Files or Drag here
              </button>
              <input class="d-none" ref="fileUpload" multiple type="file" name="files" @change="uploadFile">
            </div>
          </div>
        </div>
        <div class="row pl-0 pt-0">
          <div class="col-12" data-e2e-type="request-source-files">
            <div class="pts-font-bold pb-2"></div>
            <request-files
              :can-download="canDownloadSourceFiles"
              :useIframeDownload="false"
              :entityId="request._id"
              :documents="documents"
              :companyId="companyId"
              :isAutoScanWorkflow="isAutoScanWorkflow"
              :can-edit="canEditFiles"
              :can-delete="canDeleteFiles"
              :service="requestService"
              :is-portal-cat="isPortalCat"
              :is-cat-import-running="isCatImportRunning"
              :imported-cat-files="importedCatFiles"
              :visible-columns="sourceDocumentsColumns"
              :urlResolver="documentUrlResolver"
              :ocrUrlResolver="documentOCRUrlResolver"
              :languageCombinationId="languageCombination._id"
              @document-delete="onDocumentDelete($event)"
              @marked-reference="markDocument('isReference', $event)"
              @marked-internal="markDocument('isInternal', $event)"
              @marked-as-portal-cat="markDocument('isPortalCat', $event)"
              @marked-as-removed-from-portal-cat="markDocument('isRemovedFromPortalCat', $event)">
            </request-files>
          </div>
        </div>
      </div>
    </div>
    <cat-import-modal
        ref="catImportModal"
        :has-workflows="hasWorkflows"
        :has-workflows-with-same-language-combinations="hasWorkflowsWithSameLanguageCombinations"
        @import="runCatImport"/>
  </div>

</template>

<script src="./request-language-combination.js"></script>

<style scoped lang="scss" src="./request-language-combination.scss"></style>
