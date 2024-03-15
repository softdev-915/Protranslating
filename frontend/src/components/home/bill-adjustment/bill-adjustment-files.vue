<template>
  <div data-e2e-type="bill-adjustment-files">
    <table class="table table-sm pts-data-table table-stacked table-bordered table-hover table-striped mb-0">
      <thead class="hidden-xs-down">
        <tr role="row">
          <th ref="th" v-for="(col,index) in activeColumns" :key="`${col.name}_${index}`">{{col.name}}</th>
        </tr>
      </thead>
      <tbody data-e2e-type="bill-adjustment-files-container">
         <tr role="row" v-for="(doc,index) in documents" :key="index" :class="{'blur-loading': doc.uploading}" data-e2e-type="bill-adjustment-file">
          <td v-if="referenceVisible">
            <b class="hidden-sm-up">Reference: </b>
            <input type="checkbox" value="true" :disabled="!canEdit" :checked="doc.isReference" @change="markReference($event, index)">
          </td>
          <td v-if="filenameVisible" data-e2e-type="bill-adjustment-file-filename"><b class="hidden-sm-up">Filename: </b>{{doc.name}}</td>
          <td v-if="createdAtVisible">
            <b class="hidden-sm-up">Created At: </b>
            <span v-if="doc.createdAt">{{doc.createdAt | localDateTime('MM-DD-YYYY HH:mm')}}</span>
          </td>
          <td v-if="deletedAtVisible">
            <b class="hidden-sm-up">Deleted At: </b>
            <span v-if="doc.deletedByRetentionPolicyAt">
              {{doc.deletedByRetentionPolicyAt | localDateTime('MM-DD-YYYY HH:mm')}}
            </span>
          </td>
          <td v-if="deletedByVisible">
            <b class="hidden-sm-up">Deleted By: </b>
            {{(!doc.deletedByRetentionPolicyAt) ? '' : 'system'}}
          </td>
          <td v-if="retentionTimeVisible">
            <b class="hidden-sm-up">Retention Time: </b>
            {{retentionTotalTime(doc)}}
          </td>
          <td v-if="sizeVisible"><b class="hidden-sm-up">Size: </b>{{doc.size | virtualSize}}</td>
          <td data-e2e-type="bill-adjustment-file-download">
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
              :ref="`download_link_${doc._id}`">
                <i v-show="!doc.uploading && !doc.failed && !doc.isNew && !doc.deletedByRetentionPolicyAt && !isDisabled"
                  data-e2e-type="bill-adjustment-file-download-icon"
                  class="pts-clickable fas fa-download" @click="downloadDocument($event, doc, false)">
                </i>
             </a>
            <i v-show="isDownloadingDocument(doc)" data-e2e-type="bill-adjustment-file-download-spinner" class="fas fa-spinner fa-pulse fa-fw"></i>
          </td>
          <td v-if="removeVisible">
            <b class="hidden-sm-up">Remove: </b>
            <i v-show="doc.uploading" class="fas fa-spinner fa-pulse fa-fw"></i>
            <i
              v-show="!doc.uploading && !doc.failed && !doc.deletedByRetentionPolicyAt && !isDisabled"
              @click="deleteDocument(doc)"
              class="pts-clickable fa-solid fa-trash"
              data-e2e-type="bill-adjustment-file-delete-button"></i>
            <i v-show="doc.failed" class="fas fa-exclamation-triangle"></i>
          </td>
         </tr>
      </tbody>
    </table>
  </div>
</template>

<script src="./bill-adjustment-files.js"></script>
