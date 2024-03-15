<template>
  <div class="container-fluid drop-zone-trigger" ref="dropzonetrigger" :class="{'blur-loading-row': loading }">
    <div class="row align-items-center">
      <button
        class="btn btn-primary"
        v-show="!loading"
        data-e2e-type="activityUploadFileButton"
        @click.prevent="fireUploadPrompt($event)"
      >Upload File<i class="fas fa-plus"></i></button>
      <input data-e2e-type="addFile" id="addFile" ref="fileUploadInput" multiple type="file" name="file" @change="onFileSelect($event)" style="display: none">
      <span class="ml-2" v-show="downloadingSelectedFiles"><i class="fas fa-spinner fa-pulse fa-fw"></i></span>
      <button
        data-e2e-type="activityDownloadSelectedFiles"
        class="ml-2 pts-clickable btn btn-primary"
        @click="downloadSelectedFiles"
        v-show="!downloadingSelectedFiles && !isNew"
      >
        Download Selected Files
        <i class="fas fa-file-archive-o"></i>
      </button>
      <span class="ml-2" v-show="deletingSelectedFiles"><i class="fas fa-spinner fa-pulse fa-fw"></i></span>
      <button
        data-e2e-type="activityDeleteSelectedFiles"
        class="ml-2 pts-clickable btn btn-primary"
        @click="deleteSelectedFiles"
        v-show="!deletingSelectedFiles && !isNew"
      >
        Delete Selected Files
        <i class="fas fa-file-archive-o"></i>
      </button>
    </div>
    <div class="row align-items-center">
      <table class="table table-sm pts-data-table table-stacked table-bordered table-hover table-striped">
        <thead class="hidden-xs-down">
          <tr role="row">
            <th ref="th">Select</th>
            <th ref="th">Document Name</th>
            <th ref="th">Upload Date</th>
            <th ref="th">Actions</th>
          </tr>
        </thead>
        <tbody data-e2e-type="activity-documents-container">
            <tr role="row" v-for="(doc, docIndex) in documents" :class="{'blur-loading': doc.uploading}" :key="docIndex" data-e2e-type="activity-document">
              <td>
                <b class="hidden-sm-up">Select: </b>
                <input
                  type="checkbox"
                  value="true"
                  :checked="doc.isSelected"
                  @change="markSelected($event, docIndex)"
                  data-e2e-type="activity-document-select"
                >
              </td>
              <td data-e2e-type="activity-document-name"><b class="hidden-sm-up">Document Name: </b>{{doc.name}}</td>
              <td><b class="hidden-sm-up">Upload Date: </b>{{doc.uploadDate | localDateTime('MM-DD-YYYY HH:mm')}}</td>
              <td>
                <b class="hidden-sm-up">Actions: </b>
                <b-dropdown text="Actions" class="m-md-2" data-e2e-type="actions-button">
                  <div
                    class="dropdown-item"
                    v-for="(version, versionIndex) in doc.getAllVersions()"
                    :key="versionIndex"
                    data-e2e-type="activity-document-version"
                  >
                    {{version.createdAt | localDateTime('MM-DD-YYYY HH:mm')}}
                    <i
                      class="pts-clickable fa-solid fa-trash fa-trash-o ml-2 mr-2"
                      data-e2e-type="deleteActivityDocument"
                      @click="onDeleteDocument(version)"
                    ></i>
                    <i
                      class="pts-clickable fas fa-download"
                      data-e2e-type="downloadActivityDocument"
                      @click="downloadDocument(docIndex, versionIndex)"
                      v-show="!version.isNew"
                    ></i>
                  </div>
              </b-dropdown>
              </td>
            </tr>
        </tbody>
      </table>
      <div class="container dropfiles-modal" :class="dragndropClasses" ref="dropzone" data-e2e-type="activity-document-drag-drop">
        <div class="row align-items-start drop-zone-row">
          <div class="col drop-zone-col align-self-center">
            <i class="fas fa-cloud-upload" aria-hidden="true"></i> Drop files here
          </div>
        </div>
      </div>
      <iframe-download
        ref="iframe_doc_download"
        @download-finished="onSelectedFilesDownloadFinished()"
        @download-error="onIframeDownloadError($event)"
      />
      <confirm-dialog
        ref="confirmDelete"
        confirmationMessage="Are you sure you want to delete this version?"
        @confirm="afterConfirmDelete"
      />
    </div>
  </div>
</template>

<script src="./activity-file-management.js"></script>

<style scoped lang="scss" src="./activity-file-management.scss"></style>
