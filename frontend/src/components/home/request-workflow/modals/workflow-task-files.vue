<template>
  <div class="row">
    <div class="col-12" id="workflow-task-files" data-e2e-type="workflow-provider-task-file-table">
      <table
        class="table table-stacked table-sm pts-data-table table-bordered table-hover table-striped"
        >
        <thead class="hidden-xs-down">
          <tr role="row">
           <th v-for="c in activeColumns" :key="c">
             <span>{{ c }}</span>
           </th>
          </tr>
        </thead>
        <tbody>
          <tr role="row" v-for="(doc, index) in activeDocuments" :key="index" data-e2e-type="workflow-provider-task-file">
            <td data-e2e-type="workflow-provider-task-file-name"><b class="hidden-sm-up">{{ activeColumns[0] }}: </b>{{doc.name}}</td>
            <td v-if="canReadRegulatoryFields"><b class="hidden-sm-up">{{ activeColumns[1] }}: </b>{{doc.createdBy}}</td>
            <td><b class="hidden-sm-up">{{ activeColumns[2] }}: </b>{{doc.createdAt | localDateTime('MM-DD-YYYY HH:mm')}}</td>
              <td v-if="canReadRegulatoryFields">
                <b class="hidden-sm-up">Deleted At: </b>
                <span v-if="doc.deletedByRetentionPolicyAt">
                  {{doc.deletedByRetentionPolicyAt | localDateTime('MM-DD-YYYY HH:mm')}}
                </span>
              </td>
              <td v-if="canReadRegulatoryFields">
                <b class="hidden-sm-up">Deleted By: </b>
                {{(!doc.deletedByRetentionPolicyAt) ? '' : 'system'}}
              </td>
              <td v-if="canReadRegulatoryFields">
                <b class="hidden-sm-up">Retention Time: </b>
                {{retentionTotalTime(doc)}}
              </td>
            <td>
              <b class="hidden-sm-up">Download: </b>
              <a :href="`/get-file?noIframe=true&url=${getDocumentUrl(doc)}`" :ref="`download_link_${doc._id}`" class="download-button-link">
                <i v-show="canDownload && !isDownloadingDocument(doc) && !doc.uploading && !doc.failed && !doc.isNew && !doc.deletedByRetentionPolicyAt"
                  class="pts-clickable fas fa-download" @click="downloadDocument($event, doc, false)" data-e2e-type="workflow-provider-task-file-download">
                </i>
              </a>
              <i v-show="isDownloadingDocument(doc)" data-e2e-type="request-file-download-spinner" class="fas fa-spinner fa-pulse fa-fw"></i>
            </td>
            <td v-if="canDelete">
              <b class="hidden-sm-up">Remove: </b>
              <i v-show="doc.deleting" class="fas fa-spinner fa-pulse fa-fw"></i>
              <i v-if="canDelete" v-show="!doc.deleting && !doc.failed && !downloadingDocsMap[doc._id] && !doc.deletedByRetentionPolicyAt && !lockPreviouslyCompleted" @click="deleteDocument(doc)" class="pts-clickable fa-solid fa-trash" data-e2e-type="workflow-provider-task-file-delete"></i>
              <i v-show="doc.failed" class="fas fa-exclamation-triangle"></i>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script src="./workflow-task-files.js"></script>
