<template>
  <div class="row pb-1">
  <b-modal size="lg" hide-header-close :no-fade="true" ref="instructionsModal" :id="'provider-instructions'">
    <div slot="modal-header">
      <h6>Provider task instructions</h6>
    </div>
    <div slot="default">
      <div class="container-fluid">
        <div class="row" v-if="!canReadOwn">
          <div class="col-6">
            <div>
              Provider Instructions
            </div>
          </div>
          <div class="col-6">
            <provider-instructions-ajax-basic-select
              tabindex="0"
              data-e2e-type="provider-instructions-select"
              :selected-option="selectedProviderInstructions"
              :fetch-on-created="false"
              :is-disabled="false"
              @select="onProviderInstructionSelected"
              placeholder="Provider instructions"
              title="Provider instructions list"/>
          </div>
        </div>
        <div class="editor-container">
          <textarea
            tabindex="0"
            :readonly="canReadOwn"
            class="form-control"
            placeholder="Please input instructions..."
            data-e2e-type="provider-instructions"
            v-model="providerInstructions">
          </textarea>
        </div>
      </div>
    </div>
    <div slot="modal-footer" class="form-actions">
      <button
        data-e2e-type="provider-instructions-close-btn"
        class="btn btn-secondary pull-right"
        @click="hideModal()">Close</button>
    </div>
  </b-modal>
  <textarea
    tabindex="0"
    placeholder="Provider task instructions"
    data-e2e-type="provider-instructions-activator"
    title="Provider task instructions"
    @click="showModal()"
    :disabled="!this.canEditTask"
    class="form-control form-control-sm"
    v-model="providerInstructions">
  </textarea>
  </div>
</template>

<script src="./provider-task-instructions.js"></script>
