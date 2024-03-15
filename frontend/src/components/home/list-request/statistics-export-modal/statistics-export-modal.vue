<template>
  <b-modal hide-header-close ref="modal" size="lg">
    <div slot="modal-header" class="modal-actions">
      <h6 class="pull-left">Let's see how the exporting file will look like</h6>
      <button
        data-e2e-type="statistics-export-cancel"
        class="btn btn-secondary pull-right  mr-2"
        @click="close">
        Cancel
      </button>
      <button
        data-e2e-type="statistics-export-confirm"
        class="btn btn-primary pull-right mr-2"
        :disabled="isDownloadingPdf"
        @click="exportPdf">
        <i v-if="isDownloadingPdf" class="fas fa-spinner fa-pulse fa-fw"></i>
        <i v-else class="fas fa-file-pdf" aria-hidden="true"></i>
        Export
      </button>
    </div>
    <div slot="default">
      <div
        ref="previewContainer"
        class="preview-container"
        data-e2e-type="statistics-export-preview"
      >
        <h6 class="text-center">
          <span class="text-capitalize">{{tabName}}</span> statistics for request #
          <span data-e2e-type="request-number">{{requestNo}}</span>
        </h6>
        <div
          v-for="({languageCombination, provider, statistics}) in exportData"
          :key="`${languageCombination}-${provider.userId}`"
          class="language-combination-container"
          :data-e2e-type="`language-combination-container-${languageCombination.toLowerCase()}`"
        >
          <div class="statistics-info  mb-1">Language combination: <span>{{languageCombination}}</span></div>
          <div v-if="tabName === 'provider'" class="statistics-info mb-1">
            Provider: <span data-e2e-type="provider">{{provider.userName}}</span>
          </div>
          <statistics-table
            v-for="(item, index) in statistics"
            :key="item.statistics._id"
            :data-e2e-index="index"
            :data="item"/>
        </div>

      </div>
    </div>
    <div slot="modal-footer" class="modal-actions">
      <button class="btn btn-secondary pull-right mr-2" @click="close">
        Cancel
      </button>
      <button class="btn btn-primary pull-right mr-2" @click="exportPdf" :disabled="isDownloadingPdf">
        <i v-if="isDownloadingPdf" class="fas fa-spinner fa-pulse fa-fw"></i>
        <i v-else class="fas fa-file-pdf" aria-hidden="true"></i>
        Export
      </button>
    </div>
  </b-modal>
</template>

<script src="./statistics-export-modal.js"></script>
<style scoped lang="scss" src="./statistics-export-modal.scss"></style>
