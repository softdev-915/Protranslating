<template>
  <b-modal size="lg" hide-header-close ref="noteModal" :id="noteModalId">
    <div slot="modal-header">
      Notes
    </div>
    <div slot="default" data-e2e-type="workflow-provider-task-note-modal">
      <div class="container-fluid">
        <div class="editor-container" v-if="canEditNote && !lockPreviouslyCompleted && !isApprovedOrCancelled">
          <rich-text-editor v-model="workflowNote.notes" placeholder="Notes"></rich-text-editor>
        </div>
        <div
          v-else
          class="editor-container"
          data-e2e-type="workflow-provider-task-note-modal-read-only"
          v-html="workflowNote.notes"
        >
        </div>
      </div>
    </div>
    <div slot="modal-footer" class="form-actions">
      <button class="btn btn-secondary pull-right" @click="exit" data-e2e-type="workflow-provider-task-note-exit">Close</button>
      <button
        v-if="canEditNote && !lockPreviouslyCompleted && !isApprovedOrCancelled"
        class="btn btn-primary pull-right mr-2"
        data-e2e-type="workflow-provider-task-note-save"
        @click="save"
      >Save</button>
    </div>
  </b-modal>
</template>

<script src="./workflow-notes-modal.js"></script>
