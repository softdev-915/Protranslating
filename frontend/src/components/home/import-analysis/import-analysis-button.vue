<template>
  <div>
    <button 
      arial-label="upload import memoq invoice"
      data-e2e-type="import-memoq-icon"
      class="fas fa-file-import upload-button"
      :title="tooltip"
      :class="customClass"
      :disabled="!canUploadAnalysis"
      @click="show"
    />
  </div>
</template>
<script src="./index.js"></script>