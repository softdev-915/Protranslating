<template>
  <b-modal size="lg" hide-header-close ref="workflowAssignSegmentsEvenlyModal" id="workflowAssignSegmentsEvenlyModal" data-e2e-type="workflow-assign-segments-evenly-modal">
    <div slot="default" :class="{'blur-loading': loading}">
        <span>Currently, a 100% of the words are assigned to {{providerName}}. Would you like to split the number of words evenly?</span>
    </div>
    <div slot="modal-footer">
      <button
        v-if="!loading"
        class="btn mr-1 btn-primary mr-2"
        data-e2e-type="workflow-assign-segments-evenly-modal-accept"
        @click="assignSegmentsEvenly">Yes</button>
      <button
        v-if="!loading"
        class="btn btn-secondary"
        data-e2e-type="workflow-assign-segments-evenly-modal-close"
        @click="$emit('close-modal')">No</button>
      <span class="pull-right saving-spinner" v-show="loading">
        <i class="fas fa-spinner fa-pulse fa-fw"></i>
      </span>
    </div>
  </b-modal>
</template>

<script src="./workflow-assign-segments-evenly-modal.js"></script>
<style lang="scss" src="./workflow-assign-segments-evenly-modal.scss"></style>
