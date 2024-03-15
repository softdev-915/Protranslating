<template>
  <b-modal size="lg" hide-header-close ref="uploadUserDocument" data-e2e-type="modal-upload-user-document" @close="cancel()">
    <div slot="modal-header">
      <h6>Upload Documents</h6>
    </div>
    <div slot="default">
      <div class="container-fluid" data-e2e-type="userFileUpload">
        <div class="row align-items-center">
          <label class="col-12 col-md-2 form-check-label">
            <span class="pts-required-field">*</span> File Type
          </label>
          <div class="col-12 col-md-8">
            <simple-basic-select
              id="fileType"
              v-model="fileType"
              class="non-focusable"
              :options="fileTypes"
              title="File type list"/>
          </div>
          <div class="col-12 col-md-2">
            <button class="btn btn-primary" :disabled="!isValidFileType" data-e2e-type="uploadFileButton" @click.prevent="fireUploadPrompt($event)">Upload File</button>
            <input data-e2e-type="addFile" id="addFile" ref="fileUploadInput" type="file" name="file" @change="onFileSelect($event)" style="display: none">
          </div>
        </div>
        <div class="row align-items-center" v-if="file">
          <label class="col-12 col-md-2 form-check-label">
            File name
          </label>
          <div class="col-12 col-md-10">
            {{file.name}}
          </div>
        </div>
      </div>
    </div>
    <div slot="modal-footer">
      <button class="btn mr-1 btn-primary" :disabled="!isValid" data-e2e-type="saveFileButton" @click.prevent="emitUpload()">Save</button>
      <button class="btn btn-secondary" data-e2e-type="cancelUploadFileButton" @click.prevent="cancel()">Cancel</button>
    </div>
  </b-modal>
</template>

<script src="./file-upload.js"></script>
