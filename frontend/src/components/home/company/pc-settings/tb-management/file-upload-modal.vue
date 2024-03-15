<template>
  <b-modal size="lg" hide-header-close ref="modal" @close="cancel()" data-e2e-type="file-upload-modal">
    <div slot="modal-header">
      <h6>Upload Document</h6>
    </div>
    <div slot="default">
      <div class="container-fluid">
        <div class="row align-items-center">
          <label class="col-12 col-md-2 form-check-label" data-e2e-type="file-language-label">
            Language Combination
            <span class="pts-required-field">*</span>
          </label>
          <div class="col-12 col-md-8">
            <language-combination-select
              data-e2e-type="file-language-combination"
              v-model="languageCombinations"
              :maxSelected="1"
            />
          </div>
          <div class="col-12 col-md-2">
            <button class="btn btn-primary" @click.prevent="fireUploadPrompt">Upload File</button>
            <form ref="fileInputForm" class="d-none">
              <input ref="fileUploadInput" type="file" @change="onFileSelect($event)" data-e2e-type="file-input" accept=".csv, text/csv" />
            </form>
          </div>
        </div>
        <div class="row align-items-center">
          <label class="col-12 col-md-2 form-check-label" data-e2e-type="file-reviewed-label" for="reviewed">Reviewed By Client</label>
          <div class="col-12 col-md-8">
            <input type="checkbox" name="reviewed" id="reviewed" data-e2e-type="file-reviewed" v-model="isReviewed" />
          </div>
        </div>
        <div class="row align-items-center" v-if="file">
          <label class="col-12 col-md-2 form-check-label">File name</label>
          <div class="col-12 col-md-10">{{file.name}}</div>
        </div>
      </div>
    </div>
    <div slot="modal-footer">
      <button class="btn mr-1 btn-primary" :disabled="!isValid" @click.prevent="save" data-e2e-type="file-save-button">Save</button>
      <button class="btn btn-secondary" @click.prevent="hide">Cancel</button>
    </div>
  </b-modal>
</template>

<script src="./file-upload-modal.js"></script>
