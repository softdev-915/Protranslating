<template>
  <div :class="{ 'blur-loading-row': isLoading }" data-e2e-type="tm-management">
    <div class="actions">
      <button
        class="btn btn-primary mr-2 mb-2"
        type="button"
        data-e2e-type="resource-upload-btn"
        :disabled="!canUpload"
        @click="showFileModal">
        Upload file
        <i class="fas fa-plus"></i>
      </button>
      <button
        class="btn btn-primary mr-2 mb-2"
        type="button"
        data-e2e-type="resource-download-btn"
        :disabled="!isUserIpAllowed"
        @click="onDownload">
        Download selected memories
        <i class="fas fa-download"></i>
      </button>
      <button
        class="btn btn-primary mb-2"
        type="button"
        data-e2e-type="resource-delete-btn"
        :disabled="!canDelete"
        @click="onDelete">
        Delete selected memories
        <i class="fas fa-trash-alt"></i>
      </button>
    </div>
    <div class="row p-0">
      <div class="col-md-12">
        <table class="table table-sm table-bordered table-striped table-stacked">
          <thead class="hidden-xs-down">
            <tr>
              <th v-if="canEnterMemoryEditor"></th>
              <th>Select</th>
              <th>Name</th>
              <th>Language combination</th>
              <th>Created by</th>
              <th>Created at</th>
              <th>Updated by</th>
              <th>Updated at</th>
              <th>Deleted by</th>
              <th>Deleted at</th>
              <th>Number of segments</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="resource of resources" :key="resource._id" data-e2e-type="resource-entry">
              <td v-if="canEnterMemoryEditor">
                <a href="#" :class="{'disabled': !isUserIpAllowed}" @click.prevent="navigateToMemoryEditor(resource)">Edit</a>
              </td>
              <td>
                <b class="hidden-sm-up">Select: </b>
                <input
                  type="checkbox"
                  v-model="checkedResources[resource._id]"
                  :disabled="!canSelect(resource)"
                  data-e2e-type="resource-checkbox" />
              </td>
              <td data-e2e-type="resource-name" @dblclick="enterNameEditMode(resource._id)">
                <b class="hidden-sm-up">Document Name: </b>
                <span v-if="!isEditNameMode[resource._id]">{{ resource.name }}</span>
                <input v-else
                  ref="editNameInput"
                  type="text"
                  class="w-100"
                  name="resourceName"
                  v-model="resource.name"
                  @keypress="onResourceNameKeypress($event, resource)">
              </td>
              <td data-e2e-type="resource-language">
                <b class="hidden-sm-up">Language combination: </b>
                {{ resource.srcLang.name }} - {{ resource.tgtLang.name }}
              </td>
              <td data-e2e-type="resource-created-by">
                <b class="hidden-sm-up">Created by: </b>
                {{ resource.createdBy }}
              </td>
              <td data-e2e-type="resource-created-at">
                <b class="hidden-sm-up">Created at: </b>
                {{ resource.createdAt | localDateTime('MM-DD-YYYY HH:mm') }}
              </td>
              <td data-e2e-type="resource-updated-by">
                <b class="hidden-sm-up">Updated by: </b>
                {{ resource.updatedBy }}
              </td>
              <td data-e2e-type="resource-updated-at">
                <b class="hidden-sm-up">Updated at: </b>
                {{ resource.updatedAt | localDateTime('MM-DD-YYYY HH:mm') }}
              </td>
              <td data-e2e-type="resource-deleted-by">
                <b class="hidden-sm-up">Deleted by: </b>
                {{ resource.deleted ? resource.deletedBy : '' }}
              </td>
              <td data-e2e-type="resource-deleted-at">
                <b class="hidden-sm-up">Deleted at: </b>
                {{ (resource.deleted ? resource.deletedAt : '') | localDateTime('MM-DD-YYYY HH:mm') }}
              </td>
              <td data-e2e-type="resource-segments-num">
                <b class="hidden-sm-up">Number of segments: </b>
                {{ resource.tmInfo.numSegments }}
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

<script src="./tm-management.js"></script>
