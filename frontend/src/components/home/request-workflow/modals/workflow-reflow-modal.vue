<template>
  <b-modal size="lg" hide-header-close ref="reflowFilesModal" :id="workflowReflowModalId" :closeOnBackdrop="false">
    <div slot="modal-header">
      Reflow files
    </div>
    <div slot="default" :class="{'blur-loading': loading}" data-e2e-type="workflow-reflow-modal">
      <p v-if="isPolling">
        Waiting for export pipeline to finish...
        <i data-e2e-type="workflow-reflow-spinner" class="fas fa-spinner fa-pulse fa-fw"></i>
      </p>
      <p v-else-if="loading">
        Loading files...
        <i data-e2e-type="workflow-reflow-spinner" class="fas fa-spinner fa-pulse fa-fw"></i>
      </p>
      <div v-else class="container-fluid">
        <div class="col-12">
          <div class="row">
            <div class="col-12">
              <div class="pull-right">
                <a :href="downloadFinalFilesUrl" class="download-button-link">
                  <button
                    v-show="files.length"
                    data-e2e-type="workflow-reflow-download-all"
                    class="pts-clickable btn btn-primary request-upload-document-button">Download all</button>
                </a>
              </div>
            </div>
          </div>
          <div class="row">
            <div class="col-12" id="workflow-task-files">
              <table v-if="files.length > 0" class="table table-stacked table-sm pts-data-table table-bordered table-hover table-striped">
                  <thead class="hidden-xs-down">
                  <tr role="row">
                  <th v-for="c in activeColumns" :key="c">
                      <span>{{ c }}</span>
                  </th>
                  </tr>
                  </thead>
                  <tbody>
                  <tr role="row" v-for="(doc, index) in files" :key="index" data-e2e-type="workflow-reflow-file">
                      <td data-e2e-type="workflow-reflow-file-name"><b class="hidden-sm-up">{{ activeColumns[0] }}: </b>{{doc}}</td>
                  </tr>
                  </tbody>
                </table>
                <span v-else-if="!loading">No final files exist, please run CAT Export pipeline.</span>
              </div>
          </div>
        </div>
      </div>
    </div>
    <div slot="modal-footer" class="form-actions">
      <button class="btn btn-secondary pull-right" data-e2e-type="workflow-reflow-close" @click="closeReflowModal">Close</button>
    </div>
  </b-modal>
</template>

<script src="./workflow-reflow-modal.js"></script>
