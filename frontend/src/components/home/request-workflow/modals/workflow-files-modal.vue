<template>
  <b-modal hide-header-close ref="taskFilesModal" size="xl" :id="workflowFileModalId">
    <div slot="modal-header">
      Task files
    </div>
    <div slot="default" :class="{'blur-loading': loading}" data-e2e-type="workflow-provider-task-files-modal">
      <div class="container-fluid">
        <div class="col-12">
          <div class="row" v-if="canEditTask || canEditAll || canReadAllTasks || canProviderReadFiles">
            <div class="col-12">
              <div class="pts-font-bold pull-left" v-if="canEditTask || canEditAll">File upload</div>
              <iframe-download
                v-if="canDownload"
                ref="workflowFilesModalIframeDownload"
                :url="this.downloadAllURL"
                @download-error="onAllFilesDownloadError"
              />
              <div class="pull-right">
                <button
                  v-if="canDownload"
                  v-show="hasDownloadableDocuments"
                  data-e2e-type="workflow-provider-task-download-all"
                  class="pts-clickable btn btn-primary request-upload-document-button"
                  :class="{disabled: isDownloadingAllFiles}"
                  @click.prevent="downloadAllFilesZip"
                >
                  Download all
                </button>
                <button
                  v-show="!loading"
                  v-if="canUpload"
                  data-e2e-type="add-file-to-task"
                  class="pts-clickable btn btn-primary request-upload-document-button"
                  @click.prevent="fireUpload($event)">Add file <i class="fas fa-plus"></i></button>
                <input
                  v-if="canUpload"
                  multiple
                  id="addFile"
                  ref="fileUpload"
                  data-e2e-type="workflow-provider-task-upload-file"
                  type="file"
                  name="files"
                  style="display: none"
                  @change="onFileUpload($event)">
              </div>
            </div>
          </div>
          <workflow-task-files
            ref="documentProspect"
            :can-delete="canRemoveFiles"
            :workflow-files="workflowFiles"
            :downloading-docs-map="downloadingDocsMap"
            :lock-previously-completed="lockPreviouslyCompleted"
            :request="request"
            :isApprovedOrCancelled="isApprovedOrCancelled"
            :canDownload="canDownload"
            @document-download="onDocumentDownload"
            @document-delete="onDocumentDelete">
          </workflow-task-files>
        </div>
      </div>
    </div>
    <div slot="modal-footer" class="form-actions">
      <button v-show="!loading" class="btn btn-secondary pull-right" data-e2e-type="workflow-provider-task-files-close" @click="closeFileModal()">Close</button>
    </div>
  </b-modal>
</template>

<script src="./workflow-files-modal.js"></script>
