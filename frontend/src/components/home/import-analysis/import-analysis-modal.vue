<template>
  <b-modal size="lg" hide-header-close :no-fade="true" :id="importAnalysisId" ref="importAnalysisModal" @close="close">
      <div slot="modal-header" class="d-flex w-100">
        <nav aria-label="breadcrumb">
          <ol class="breadcrumb">
            <li
              aria-current="page"
              class="breadcrumb-item"
              @click="activeView = view.name"
              :class="{'active': view.active}"
              v-for="view in views">{{ view.text }}</li>
            </ol>
          </nav>
        </div>
      <div slot="default">
        <div class="container-fluid mt-2" v-if="isImportalAnalysisModaliew">
          <h6>Please select import format from the options below</h6>
          <div class="analysis-option mt-3">
            <input
              :id="`reflecting-displayed-results-${requestId}`"
              data-e2e-type="import-type-reflecting_displayed_results"
              type="radio"
              v-model="csvType"
              value="reflecting_displayed_results">
            <label :for="`reflecting-displayed-results-${requestId}`" data-e2e-type="import-type-label-reflecting_displayed_results"><span class="pts-font-bold">memoQ</span> CSV (Reflecting displayed results)</label>
          </div>
          <div class="analysis-option">
            <input
              :id="`per-type-all-information-${requestId}`"
              data-e2e-type="import-type-per_type_all_information"
              type="radio"
              v-model="csvType"
              value="per_file_all_information">
            <label :for="`per-type-all-information-${requestId}`" data-e2e-type="import-type-label-per_type_all_information"><span class="pts-font-bold">memoQ</span> CSV (Per-file, all information)</label>
          </div>
          <div class="analysis-option">
            <input
              :id="`trados-${requestId}`"
              data-e2e-type="import-type-trados"
              type="radio"
              v-model="csvType"
              value="trados"/>
            <label :for="`trados-${requestId}`" data-e2e-type="import-type-label-trados"><span class="pts-font-bold">Trados</span> CSV</label>
          </div>
          <div class="analysis-option">
            <input
              :id="`memsource-${requestId}`"
              data-e2e-type="import-type-memsource"
              type="radio"
              v-model="csvType"
              value="memsource"/>
            <label :for="`memsource-${requestId}`" data-e2e-type="import-type-label-memsource"><span class="pts-font-bold">Memsource</span> CSV</label>
          </div>
          <div class="analysis-option">
            <input
              :id="`portalcat-${requestId}`"
              data-e2e-type="import-type-portalcat"
              type="radio"
              v-model="csvType"
              value="portalcat"/>
            <label :for="`portalcat-${requestId}`" data-e2e-type="import-type-label-portalcat"><span class="pts-font-bold">PortalCAT</span></label>
          </div>
        </div>
        <div class="container-fluid mt-2" v-else>
          <div>
            <h6>Analysis Option</h6>
            <div class="mt-2 analysis-option">
              <input
                :id="`analysis-option-client_analysis-${requestId}`"
                data-e2e-type="analysis-option-input-client_analysis"
                type="radio"
                v-model="analysisOption"
                value="client_analysis">
              <label :for="`analysis-option-client_analysis-${requestId}`" data-e2e-type="analysis-option-label-client_analysis">Client Analysis</label>
            </div>
            <div class="mt-2 analysis-option">
              <input
                :id="`analysis-option-provider_analysis-${requestId}`"
                data-e2e-type="analysis-option-input-provider_analysis"
                type="radio"
                v-model="analysisOption"
                value="provider_analysis">
              <label :for="`analysis-option-provider_analysis-${requestId}`" data-e2e-type="analysis-option-label-provider_analysis">Provider Analysis</label>
            </div>
          </div>
          <div class="language-combination-container mt-3">
            <h6>Language Combinations</h6>
            <div
              v-if="hasStatisticsRun"
              v-for="languageCombination in languageCombinations"
              class="mt-2 language-combination-option">
              <input
                :id="`language-combination-${languageCombination.isoCode}`"
                :data-e2e-type="`language-combination-input-${languageCombination.isoCode}`"
                type="radio"
                v-model="activeLanguageCombination"
                :value="languageCombination.isoCode">
              <label :for="`language-combination-${languageCombination.isoCode}`" :data-e2e-type="`language-combination-label-${languageCombination.isoCode}`">{{ languageCombination.name }}</label>
            </div>
          </div>
          <div class="file-container mt-3">
            <h6>Select Files</h6>
            <div class="mt-2">
              <input
                :id="`import-all-portalcat-files-${requestId}`"
                data-e2e-type="import-all-portal-cat-files"
                type="radio"
                v-model="shouldImportAllPortalCATFiles"
                :value="true"
                :disabled="!hasStatisticsRun || hasSelectedFiles">
              <label :for="`import-all-portalcat-files-${requestId}`" data-e2e-type="import-all-portalcat-files">All Files</label>
            </div>
            <div
              v-if="hasStatisticsRun"
              v-for="doc in documents"
              class="mt-2 file-option">
              <input
                :id="`import-portalcat-file-${doc.name}`"
                :data-e2e-type="`import-portalcat-file-${doc.name}`"
                type="checkbox"
                v-model="selectedDocuments"
                :value="doc.name">
              <label :for="`import-portalcat-file-${doc.name}`" :data-e2e-type="`import-all-portalcat-files-${doc.name}`">{{ doc.name }}</label>
            </div>
          </div>
        </div>
      </div>
      <div slot="modal-footer" class="d-flex w-100 justify-content-end">
        <button
          data-e2e-type="import-memoq-cancel-button"
          class="btn btn-danger mr-2"
          @click.prevent="close">
          Cancel
        </button>
        <file-upload
          v-if="csvType !== 'portalcat'"
          data-e2e-type="import-memoq-analysis" @on-file-selected="parseMemoqFile">
          <button
            slot="file-upload-button"
            data-e2e-type="import-memoq-upload-button"
            arial-label="upload import memoq analysis"
            class="btn btn-white">Upload</button>
        </file-upload>
        <button
          v-if="isImportalAnalysisModaliew && csvType === 'portalcat'"
          data-e2e-type="import-memoq-continue-button"
          class="btn btn-primary"
          @click.prevent="enterPortalCatModal">
          Continue
        </button>
        <button
          v-if="!isImportalAnalysisModaliew && csvType === 'portalcat'"
          data-e2e-type="import-memoq-confirm-import"
          :disabled="!hasStatisticsRun || !isValid"
          class="btn btn-primary"
          @click.prevent="importPortalStatistics">
          Confirm Import
        </button>
      </div>
  </b-modal>
</template>

<script src="./import-analysis-modal.js"></script>
<style scoped lang="scss" src="./import-analysis-modal.scss" />
