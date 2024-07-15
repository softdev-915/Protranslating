<template>
  <span>
    <span @click="onFileUpload" data-e2e-type="file-upload-button-container">
      <slot name="file-upload-button" />
    </span>
    <input
      type="file"
      ref="fileInput"
      data-e2e-type="file-upload-input"
      @change="onFileInputChanged"
      :hidden="hasFileUploadButtonSlot"
      :disabled="disabled"
      :accept="accept"
    />
  </span>
</template>
<script src="./index.js"></script>
