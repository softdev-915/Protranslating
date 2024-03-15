<template>
  <div v-if="isProgress" id="progress-container">
    <h1 data-e2e-type="progress-bar" id="progress">{{progress}}</h1>
    <button class="btn btn-danger cancel-upload-button" data-e2e-type="cancel-uploading-button"
      @click="cancelDialog">Cancel</button>
    <confirm-dialog data-e2e-type="cancel-uploading-confirmation-dialog" ref="cancelUploading"
      :show-remember-option="true" :container-class="'small-dialog'" :confirmation-title="'WARNING'"
      :confirmation-message=confirmationMessage @confirm="confirm" @cancel="cancel">
    </confirm-dialog>
  </div>
</template>

<script src="./progress-upload.js"></script>
<style src="./progress-upload.scss" lang="scss"></style>