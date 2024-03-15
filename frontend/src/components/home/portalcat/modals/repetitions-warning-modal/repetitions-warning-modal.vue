<template>
  <b-modal size="lg" hide-header-close ref="bModal" :close-on-backdrop="false">
    <div slot="modal-header">
      <strong>
        Warning
      </strong>
    </div>
    <div slot="default">
      <p data-e2e-type="repetitions-warning-message">
        You are about to make a change to a previously approved segment that is a repetition. Would you like to apply the change?
      </p>
      <div class="">
        <span>Do not show this message again</span>
        <input class="pull-left pts-clickable mt-1 mr-1" type="checkbox" v-model="isRepetitionsWarningDisabled" data-e2e-type="do-not-show-again">
      </div>
    </div>
    <div slot="modal-footer" class="form-actions">
      <button class="btn btn-secondary" type="button" @click="confirm" data-e2e-type="update-repetitions-confirm">Yes</button>
      <button class="btn btn-primary" type="button" @click="cancel" data-e2e-type="update-repetitions-cancel">No</button>
    </div>
  </b-modal>
</template>

<script src="./repetitions-warning-modal.js"></script>
