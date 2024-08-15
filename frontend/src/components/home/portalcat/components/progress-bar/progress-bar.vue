<template>
  <div class="ui-set-progress-bar" data-e2e-type="portalcat-progress-bar">
    <div class="row">
      <div class="col-12 col-lg-3">
        <div class="info-container" data-e2e-type="progressbar-files-total">
          <p class="mb-0">
            Total:<span v-show="!hasImportPipelineError && !arePipelinesEmpty"> {{ activeDocumentWordsCount }} out of {{ totalWordsCount }} words in {{ documents.length }} files</span>
          </p>
        </div>
      </div>
      <div class="col-12 col-lg-9">
        <div class="info-container" data-e2e-type="progressbar-file-progress">
          <p class="mb-0">
            Task Progress:<span v-show="!hasImportPipelineError && !arePipelinesEmpty"> {{ activeDocumentName }} | {{ taskWordsProgressCount }} out of {{ activeDocumentWordsCount }} words translated</span>
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<script src="./progress-bar.js"></script>
