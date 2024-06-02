<template>
  <div :class="{ 'blur-loading-row': isLoading }" data-e2e-type="sr-management">
    <div class="actions">
      <button class="btn btn-primary mr-2 mb-2" type="button" data-e2e-type="resource-upload-btn" :disabled="!canUpload" @click="showSrxFileModal">
        Upload File
        <i class="fas fa-plus"></i>
      </button>
      <button class="btn btn-primary mr-2 mb-2" type="button" data-e2e-type="resource-download-btn" :disabled="!isUserIpAllowed" @click="onDownload">
        Download Selected Files
        <i class="fas fa-download"></i>
      </button>
      <button class="btn btn-primary mb-2" type="button" data-e2e-type="resource-delete-btn" :disabled="!canDelete" @click="onDelete">
        Delete Selected Files
        <i class="fas fa-trash-alt"></i>
      </button>
    </div>
    <div class="row p-0">
      <div class="col-lg-6">
        <table class="table table-sm table-bordered table-striped table-stacked">
          <thead class="hidden-xs-down">
            <tr>
              <th>Select</th>
              <th>Document Name</th>
              <th>Language</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="resource of resources" :key="resource._id" data-e2e-type="resource-entry">
              <td>
                <b class="hidden-sm-up">Select: </b>
                <input
                  type="checkbox"
                  v-model="checkedResources[resource._id]"
                  :disabled="!isUserIpAllowed"
                  data-e2e-type="resource-checkbox" />
              </td>
              <td data-e2e-type="resource-name">
                <b class="hidden-sm-up">Document Name: </b>
                {{ resource.name }}
              </td>
              <td data-e2e-type="resource-language">
                <b class="hidden-sm-up">Language: </b>
                {{ resource.language.name }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
    <srx-file-modal ref="srxFileModal" @file-upload="onUpload" />
    <confirm-dialog
      containerClass="small-dialog"
      ref="confirmDialog"
      confirmationMessage="Only one SRX file is allowed per language. Uploading a new one will replace the current one. Are you sure you want to proceed?"
      confirmationTitle="Warning"
      @confirm="onDialogConfirm"
      data-e2e-type="resource-overwrite-confirm-dialog"
    />
    <a href="#" ref="downloadLink" class="d-none"></a>
  </div>
</template>

<script src="./sr-management.js"></script>
