<template>
  <b-modal size="lg" hide-header-close ref="bModal" data-e2e-type="portalcat-lock-config-modal">
    <div slot="modal-header">
      <h5 data-e2e-type="lock-segments-modal-title">Lock Segments</h5>
    </div>
    <div slot="default">
      <div class="row">
        <div class="col-12 font-weight-bold">
          <label>Lock Segments</label>
        </div>
        <div class="col-12">
          <multi-select
            data-e2e-type="lock-segments-multi-select"
            placeholder="Select Segments"
            title="Lock Segments"
            name="lockSegments"
            :options="breakdowns"
            :selected-options="lockedSegmentsSelected"
            @select="onLockedSegmentsSelect"
            :is-disabled="!canUpdateLockConfig"></multi-select>
        </div>
        <div class="col-12 mt-2">
          <label for="selected">
            <input
              data-e2e-type="lock-segments-manual-select"
              id="selected"
              name="Selected"
              type="checkbox"
              :disabled="!canLockManual"
              v-model="manualLocking"/>
            <span>Selected (manual locking only)</span>
          </label>
        </div>
      </div>
      <div class="row mt-2">
        <div class="col-12 font-weight-bold">
          <label>Change Segment Status to 'Confirmed by'</label>
        </div>
        <div class="col-12">
          <label for="translator">
            <input
              data-e2e-type="lock-segment-confirmed-by-translator"
              id="translator"
              type="radio"
              name="segment-confirmed-by"
              value="CONFIRMED_BY_TRANSLATOR"
              v-model="lockConfig.newConfirmedBy"
              :disabled="!canUpdateStatus">
            <span>Translator</span>
          </label>
        </div>
        <div class="col-12">
          <label for="postEditor">
            <input
              data-e2e-type="lock-segment-confirmed-by-post-editor"
              id="postEditor"
              type="radio"
              name="segment-confirmed-by"
              value="CONFIRMED_BY_EDITOR"
              v-model="lockConfig.newConfirmedBy"
              :disabled="!canUpdateStatus">
            <span>Editor/Post-Editor</span>
          </label>
        </div>
        <div class="col-12">
          <label for="qaEditor">
            <input
              data-e2e-type="lock-segment-confirmed-by-qa-editor"
              id="qaEditor"
              type="radio"
              name="segment-confirmed-by"
              value="CONFIRMED_BY_QA_EDITOR"
              v-model="lockConfig.newConfirmedBy"
              :disabled="!canUpdateStatus">
            <span>QA Editor</span>
          </label>
        </div>
      </div>
      <div class="row mt-2">
        <div class="col-12 font-weight-bold">
          <label>Scope</label>
        </div>
        <div class="col-12">
          <label for="currentFile">
            <input
              data-e2e-type="lock-scope-current-file"
              id="currentFile"
              type="radio"
              name="scope"
              value="file"
              v-model="appliedScope"
              :disabled="!canUpdateScope">
            <span>Current file</span>
          </label>
        </div>
        <div class="col-12">
          <label for="taskFile">
            <input
              data-e2e-type="lock-scope-task-file"
              id="taskFile"
              type="radio"
              name="scope"
              value="task"
              v-model="appliedScope"
              :disabled="!canUpdateScope">
            <span>All task files</span>
          </label>
        </div>
        <div class="col-12">
          <label for="requestFile">
            <input
              data-e2e-type="lock-scope-request-file"
              id="requestFile"
              type="radio"
              name="scope"
              value="request"
              v-model="appliedScope"
              :disabled="!canUpdateScope">
            <span>All request files</span>
          </label>
        </div>
      </div>
    </div>
    <div slot="modal-footer" class="form-actions">
      <button
        data-e2e-type="cancel-lock-segments"
        class="btn btn-secondary"
        type="button"
        @click="hide">Cancel</button>
      <button
        data-e2e-type="reset-lock-segments"
        class="btn btn-secondary"
        type="button"
        @click="reset"
        :disabled="!canReset">
        Reset to Company Default
      </button>
      <button
        data-e2e-type="apply-lock-segments"
        class="btn btn-primary"
        type="button"
        @click="apply"
        :disabled="!canApply">
        Apply
        <i v-show="isLoadingLocal" class="fas fa-spinner in-progress"></i>
      </button>
    </div>
  </b-modal>
</template>

<script src="./lock-config-modal.js"></script>
