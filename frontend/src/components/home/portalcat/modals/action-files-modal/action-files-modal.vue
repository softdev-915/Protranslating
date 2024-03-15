<template>
  <b-modal size="lg" hide-header-close ref="bModal" :id="modalId" :closeOnBackdrop="false">
    <div slot="modal-header">
      <strong>{{ actionName }}</strong> action files
    </div>
    <div slot="default">
      <action-files :files="downloads" :actionId="actionId" :pipelineId="pipelineId"></action-files>
    </div>
    <div slot="modal-footer" class="form-actions">
      <button class="btn btn-secondary pull-right" type="button" @click="closeModal(modalId)">Close</button>
    </div>
  </b-modal>
</template>

<script src="./action-files-modal.js"></script>
