<template>
  <div :class="{ 'blur-loading-row': isLoading }" data-e2e-type="tb-management">
    <div class="actions">
      <button class="btn btn-primary mr-2 mb-2" type="button" data-e2e-type="resource-upload-btn" :disabled="!canUpload" @click="showFileModal">
        Upload File
        <i class="fas fa-plus"></i>
      </button>
      <button class="btn btn-primary mr-2 mb-2" type="button" data-e2e-type="resource-download-btn" @click="onDownload" :disabled="!isUserIpAllowed">
        Download Selected Files
        <i class="fas fa-download"></i>
      </button>
      <button class="btn btn-primary mb-2" type="button" data-e2e-type="resource-delete-btn" :disabled="!canDelete" @click="onDelete">
        Delete Selected Files
        <i class="fas fa-trash-alt"></i>
      </button>
    </div>
    <div class="row p-0">
      <div class="col-md-12">
        <table class="table table-sm table-bordered table-striped table-stacked">
          <thead class="hidden-xs-down">
            <tr>
              <th>Select</th>
              <th>Name</th>
              <th>Language Combination</th>
              <th>Created By</th>
              <th>Created At</th>
              <th>Updated By</th>
              <th>Updated At</th>
              <th>Deleted By</th>
              <th>Deleted At</th>
              <th>Number Of Terms</th>
              <th>Reviewed By Client</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="resource of resources" :key="resource._id" data-e2e-type="resource-entry">
              <td>
                <b class="hidden-sm-up">Select: </b>
                <input
                  type="checkbox"
                  v-model="checkedResources[resource._id]"
                  data-e2e-type="resource-checkbox"
                  :disabled="!isUserIpAllowed || resource.deleted"/>
              </td>
              <td data-e2e-type="resource-name">
                <b class="hidden-sm-up">Name: </b>
                {{ resource.name }}
              </td>
              <td data-e2e-type="resource-language">
                <b class="hidden-sm-up">Language Combination: </b>
                {{ resource.srcLang.name }} - {{ resource.tgtLang.name }}
              </td>
              <td data-e2e-type="resource-uploaded-by">
                <b class="hidden-sm-up">Created By: </b>
                {{ resource.createdBy }}
              </td>
              <td data-e2e-type="resource-uploaded-by">
                <b class="hidden-sm-up">Created At: </b>
                {{ resource.createdAt | localDateTime('MM-DD-YYYY HH:mm') }}
              </td>
              <td data-e2e-type="resource-updated-by">
                <b class="hidden-sm-up">Updated By: </b>
                {{ resource.updatedBy }}
              </td>
              <td data-e2e-type="resource-updated-at">
                <b class="hidden-sm-up">Updated At: </b>
                {{ resource.updatedAt | localDateTime('MM-DD-YYYY HH:mm') }}
              </td>
              <td data-e2e-type="resource-deleted-by">
                <b class="hidden-sm-up">Deleted By: </b>
                {{ resource.deleted ? resource.deletedBy : '' }}
              </td>
              <td data-e2e-type="resource-deleted-at">
                <b class="hidden-sm-up">Deleted At: </b>
                {{ (resource.deleted ? resource.deletedAt : '') | localDateTime('MM-DD-YYYY HH:mm') }}
              </td>
              <td data-e2e-type="resource-num-terms">
                <b class="hidden-sm-up">Number Of Terms: </b>
                {{ resource.tbInfo.numEntries }}
              </td>
              <td data-e2e-type="resource-reviewed">
                <b class="hidden-sm-up">Reviewed By Client: </b>
                {{ resource.isReviewedByClient ? 'Yes' : 'No' }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
    <file-modal ref="fileModal" @file-upload="onUpload" />
    <confirm-dialog
      containerClass="small-dialog"
      ref="confirmDialog"
      :confirmationMessage="confirmationMessage"
      confirmationTitle="Warning"
      @confirm="onDialogConfirm"
      data-e2e-type="resource-overwrite-confirm-dialog"
    />
    <a href="#" ref="downloadLink" class="d-none"></a>
  </div>
</template>

<script src="./tb-management.js"></script>
