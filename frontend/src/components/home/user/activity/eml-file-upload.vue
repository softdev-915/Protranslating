<template>
  <label
    ref="dropzone"
    class="header-link"
    id="eml-upload-button"
    title="Add Email Activity"
    aria-label="Add Email Activity" 
    :class="{ 'dropzone-dragging': dragging }">
      <i class="fas fa-bar-chart pts-clickable" aria-hidden="true"></i>
      <input
        type="file"
        id="eml-file-input"
        @change="onFileInputChanged"
        style="display: none">
  </label>
</template>

<script src="./eml-file-upload.js"></script>

<style lang="scss" scoped src="./eml-file-upload.scss"></style>


