<template>
  <b-modal size="lg" hide-header-close ref="modal" class="segment-history-modal" data-e2e-type="segment-history-modal" :id="modalId" :closeOnBackdrop="false">
    <div slot="modal-header">
      <h4>Segment history</h4>
    </div>
    <div slot="default">
      <div class="text-center" v-if="isHistoryLoading">
        <i class="fas fa-spinner in-progress"></i>
      </div>
      <table v-else class="table table-sm table-bordered table-striped table-stacked">
        <thead class="hidden-xs-down">
          <tr>
            <th>Source</th>
            <th>Target</th>
            <th>Actions</th>
            <th>Company hierarchy</th>
            <th>Created by</th>
            <th>Created at</th>
            <th>File</th>
            <th>Status</th>
            <th>Type</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(segment, index) of segmentHistoryItems" :key="segment._id">
            <td>
              <b class="hidden-sm-up">Source: </b>
              {{ segment.source.text }}
            </td>
            <td data-e2e-type="resource-name" @dblclick="enterNameEditMode(resource._id)">
              <b class="hidden-sm-up">Target: </b>
              {{ segment.target.text }}
            </td>
            <td data-e2e-type="resource-language">
              <b class="hidden-sm-up">Actions: </b>
              {{ getHistoryActions(segment, index) }}
            </td>
            <td data-e2e-type="resource-language">
              <b class="hidden-sm-up">Company hierarchy: </b>
              {{ segment.companyId }}
            </td>
            <td data-e2e-type="resource-created-by">
              <b class="hidden-sm-up">Created by: </b>
              {{ segment.createdBy }}
            </td>
            <td data-e2e-type="resource-created-at">
              <b class="hidden-sm-up">Created at: </b>
              {{ segment.createdAt | localDateTime('MM-DD-YYYY HH:mm') }}
            </td>
            <td data-e2e-type="resource-updated-by">
              <b class="hidden-sm-up">File: </b>
              {{ segment.fileName }}
            </td>
            <td data-e2e-type="resource-updated-at">
              <b class="hidden-sm-up">Status: </b>
              <div class="text-center">
                <status-icon :status="segment.status" />
              </div>
            </td>
            <td data-e2e-type="resource-deleted-by">
              <b class="hidden-sm-up">Type: </b>
              <span v-if="segment.origin === 'HT'" class="type type-ht">HT</span>
              <span v-else-if="segment.origin === 'MT'" class="type type-mt">MT</span>
              <span v-else-if="segment.matched">TM {{ segment.tmMatchInfo.score }}%</span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
    <div slot="modal-footer">
      <button class="btn btn-secondary" data-e2e-type="segment-history-modal-close" @click.prevent="closeModal(modalId)">Close</button>
    </div>
  </b-modal>
</template>

<script src="./segment-history-modal.js"></script>
<style lang="scss">
.segment-history-modal {
  .modal-dialog {
    max-width: 1200px;
  }
}
</style>
