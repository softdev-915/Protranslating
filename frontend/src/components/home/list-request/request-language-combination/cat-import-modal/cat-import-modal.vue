<template>
  <b-modal
      hide-header-close
      data-e2e-type="cat-import-modal"
      ref="modal"
      size="md"
      class="cat-import-modal-container"
      :closeOnBackdrop="false">
    <div slot="modal-header">
      <h6>Import to Workflow</h6>
      <button
          data-e2e-type="import-modal-close-icon"
          class="close"
          @click="close">×</button>
    </div>
    <div slot="default">
      <div class="destination-label mb-2">Select a Destination</div>
     <div class="d-flex justify-content-center">
       <label
           class="radio-button mr-3"
           :class="{active: workflowCreationStrategy === workflowCreationStrategyNew}">
         <input
             data-e2e-type="new-workflow-radio"
             type="radio"
             name="strategy-select"
             class="mr-1"
             :value="workflowCreationStrategyNew"
             v-model="workflowCreationStrategy"/>
         <span class="m-0"> New Workflow(s)</span>
       </label>
       <label class="radio-button"
       :class="{
         active: workflowCreationStrategy === workflowCreationStrategyExisting,
         'pts-not-allowed':isExistingWorkflowOptionDisabled
       }">
         <input
             data-e2e-type="existing-workflow-radio"
             type="radio"
             name="strategy-select"
             class="mr-1"
             :disabled="isExistingWorkflowOptionDisabled"
             :value="workflowCreationStrategyExisting"
             v-model="workflowCreationStrategy"/>
         <span class="m-0">Existing Workflow(s)</span>
       </label>
     </div>
    </div>
    <div slot="modal-footer" class="modal-actions text-right">
      <button
          data-e2e-type="import-modal-cancel-button"
          class="btn btn-outline-secondary mr-2 cancel"
          @click="close">
        Cancel
      </button>
      <button
          data-e2e-type="import-modal-submit-button"
          class="btn btn-primary"
          @click="runCatImport">
        Import
      </button>
    </div>
  </b-modal>
</template>

<script src="./cat-import-modal.js"></script>
<style scoped lang="scss" src="./cat-import-modal.scss"></style>
<style lang="scss">
.cat-import-modal-container .modal-dialog {
    max-width: 500px;
  .modal-header>div{
    display: flex;
    width: 100%;
    justify-content: space-between;
  }
  .close:focus{
    outline: none;
  }
}
</style>
