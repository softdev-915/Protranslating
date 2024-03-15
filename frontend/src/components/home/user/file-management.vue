<template>
  <div class="container-fluid drop-zone-trigger" ref="dropzonetrigger" :class="{'blur-loading-row': loading }">
    <div class="row align-items-center">
      <button data-e2e-type="userUploadFile" class="pts-clickable btn btn-primary" @click="uploadFile">File Upload <i class="fas fa-plus"></i></button>
      <span class="ml-2" v-show="downloadingAllFiles"><i class="fas fa-spinner fa-pulse fa-fw"></i></span>
      <button
        data-e2e-type="userDownloadAllFiles"
        class="ml-2 pts-clickable btn btn-primary"
        @click="downloadAllFiles"
        v-show="!downloadingAllFiles"
        :disabled="!isDownloadAllVisible"
      >Download All Files <i class="fas fa-file-archive-o"></i></button>
    </div>
    <div class="row align-items-center">
      <table class="table table-sm pts-data-table table-stacked table-bordered table-hover table-striped">
        <thead class="hidden-xs-down">
          <tr role="row">
            <th ref="th">Document Name</th>
            <th ref="th">Document Type</th>
            <th ref="th">Upload Date</th>
            <th ref="th">Actions</th>
          </tr>
        </thead>
        <tbody data-e2e-type="user-documents-container">
            <tr role="row" v-for="(doc, docIndex) in documents" :class="{'blur-loading': doc.uploading}" :key="docIndex" data-e2e-type="user-document">
              <td><b class="hidden-sm-up">Document Name: </b>{{doc.name}}</td>
              <td><b class="hidden-sm-up">Document Type: </b>{{doc.type}}</td>
              <td><b class="hidden-sm-up">Upload Date: </b>{{doc.uploadDate | localDateTime('MM-DD-YYYY HH:mm')}}</td>
              <td>
                <b class="hidden-sm-up">Actions: </b>
                <b-dropdown variant="primary" text="Actions" class="m-md-2" data-e2e-type="actions-button">
                  <div class="dropdown-item" v-for="(version, versionIndex) in doc.getAllVersions()" :key="versionIndex" data-e2e-type="user-document-version">
                    {{version.createdAt | localDateTime('MM-DD-YYYY HH:mm')}}
                    <i class="pts-clickable fas fa-trash fa-trash-o ml-2 mr-2" data-e2e-type="deleteUserDocument" @click="onDeleteDocument(version)"></i>
                    <i
                      class="pts-clickable fas fa-download"
                      data-e2e-type="downloadUserDocument"
                      @click="downloadDocument(docIndex, versionIndex)"
                      v-show="!version.isNew"
                    ></i>
                  </div>
              </b-dropdown>
              </td>
            </tr>
        </tbody>
      </table>
      <div class="container dropfiles-modal" :class="dragndropClasses" ref="dropzone" data-e2e-type="user-document-drag-drop">
        <div class="row align-items-start drop-zone-row">
          <div class="col drop-zone-col align-self-center">
            <i class="fas fa-cloud-upload" aria-hidden="true"></i> Drop files here
          </div>
        </div>
      </div>
      <iframe-download
        ref="iframe_doc_download"
        @download-finished="onAllFilesDownloadFinished()"
        @download-error="onIframeDownloadError($event)"
      />
      <file-upload
        ref="documentUpload"
        :draggedFile="draggedFile"
        v-model="documents"
        :userId="userId"
        @upload-document="uploadDocument"
      />
      <confirm-dialog
        ref="confirmDelete"
        confirmationMessage="Are you sure you want to delete this version?"
        @confirm="afterConfirmDelete"
      />
    </div>
  </div>
</template>

<script src="./file-management.js"></script>

<style scoped lang="scss" src="./file-management.scss"></style>
