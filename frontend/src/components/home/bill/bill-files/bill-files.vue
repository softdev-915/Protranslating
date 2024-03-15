<template>
  <div data-e2e-type="bill-files">
    <table class="table table-sm pts-data-table table-stacked table-bordered table-hover table-striped">
      <thead class="hidden-xs-down">
        <tr role="row">
          <th ref="th" v-for="col in activeColumns">{{col.name}}</th>
        </tr>
      </thead>
      <tbody data-e2e-type="bill-files-container">
         <tr
           v-for="(doc,index) in documents"
           role="row"
           :class="{'blur-loading': doc.uploading}"
           data-e2e-type="bill-file"
         >
          <td v-if="filenameVisible" data-e2e-type="bill-file-filename"><b class="hidden-sm-up">Filename: </b>{{doc.name}}</td>
          <td v-if="createdAtVisible">
            <b class="hidden-sm-up">Created At: </b>
            <span data-e2e-type="bill-file-created-at">
              {{ doc.createdAt | localDateTime('MM-DD-YYYY HH:mm') }}
            </span>
          </td>
          <td v-if="uploadedByVisible">
            <b class="hidden-sm-up">Uploaded by: </b>
            <span data-e2e-type="bill-file-uploaded-by">{{ doc.createdBy }}</span>
          </td>
          <td v-if="deletedAtVisible">
            <b class="hidden-sm-up">Deleted At: </b>
            <span data-e2e-type="bill-file-deleted-at">
              {{ doc.deletedAt | localDateTime('MM-DD-YYYY HH:mm') }}
            </span>
          </td>
          <td v-if="deletedByVisible">
            <b class="hidden-sm-up">Deleted By: </b>
            <span data-e2e-type="bill-file-deleted-by">{{ doc.deletedBy }}</span>
          </td>
          <td v-if="retentionTimeVisible">
            <b class="hidden-sm-up">Retention Time:</b>
            <span data-e2e-type="bill-file-retention-time">{{ retentionTotalTime(doc) }}</span>
          </td>
          <td
            v-if="downloadVisible"
            data-e2e-type="bill-file-download">
            <div v-if="!doc.deleted">
              <b class="hidden-sm-up">Download: </b>
              <iframe-download
                v-if="!doc.uploading && !doc.failed && !doc.isNew"
                :ref="`iframe_doc_${doc._id}`"
                @download-finished="onDownloadFinished(index)"
                @download-error="onIframeDownloadError($event)">
              </iframe-download>
              <a
                :href="`/get-file?noIframe=true&url=${getDocumentUrl(doc)}`"
                class="download-button-link"
                :ref="`download_link_${doc._id}`"
                data-e2e-type="bill-file-download-link"
              >
                  <i v-show="!doc.uploading && !doc.failed && !doc.isNew && !doc.deletedByRetentionPolicyAt && !isDisabled"
                    data-e2e-type="bill-file-download-icon"
                    class="pts-clickable fas fa-download" @click="downloadDocument($event, doc, false)">
                  </i>
              </a>
              <i v-show="isDownloadingDocument(doc)" data-e2e-type="bill-file-download-spinner" class="fas fa-spinner fa-pulse fa-fw"></i>
            </div>
          </td>
          <td v-if="removeVisible">
            <div v-if="!doc.deleted">
              <b class="hidden-sm-up">Remove: </b>
              <i v-show="doc.uploading" class="fas fa-spinner fa-pulse fa-fw"></i>
              <i v-show="!doc.uploading && !doc.failed && !doc.deletedByRetentionPolicyAt && !isDisabled" @click="deleteDocument(doc)" class="pts-clickable fa-solid fa-trash" data-e2e-type="bill-file-delete-button"></i>
              <i v-show="doc.failed" class="fas fa-exclamation-triangle"></i>
            </div>
          </td>
         </tr>
      </tbody>
    </table>
  </div>
</template>

<script src="./bill-files.js"></script>
