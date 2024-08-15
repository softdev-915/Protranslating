<template>
  <div class="container-fluid">
    <div class="row mb-2">
      <file-upload class="col-2" @on-file-selected="importFile">
        <button
          type="button"
          slot="file-upload-button"
          data-e2e-type="import-entities-button"
          class="btn btn-primary"
        >
          <i class="fas fa-file-import"></i> Import XLSX/CSV
        </button>
      </file-upload>
      <iframe-download
        ref="exportEntitiesIframe"
        :url="exportEntitiesURL"
      />
      <div class="col-2 ml-4">
        <button
          type="button"
          data-e2e-type="export-entities-button"
          class="btn btn-primary"
          @click="exportEntities"
        >
          <i class="fas fa-file-import"></i> Export XLSX Template
        </button>
      </div>
    </div>
  </div>
</template>
<script src="./import-entities.js"></script>
