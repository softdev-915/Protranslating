<template>
  <b-modal
      size="lg"
      hide-header-close
      data-e2e-type="action-config-template-confirm-modal"
      ref="modal"
      class="action-config-template-confirm-modal"
      :closeOnBackdrop="false"
  >
    <div slot="default">
      <div v-if="isCreateMode" class="modal-heading">
        Save New Template
      </div>
      <div v-else class="modal-heading">
        <template v-if="isHideMode">
          <img  class="warning-icon" src="./icons/warningIcon.svg" alt="Warning Icon">
          <div class="warning-heading">
            <div>Hide Template</div>
            <div>You're going to hide <span class="text-primary">{{templateName}}.</span> Are you sure?</div>
          </div>
        </template>
        <template v-else-if="isUpdateMode">
          <img  class="warning-icon" src="./icons/dangerIcon.svg" alt="Danger Icon">
          <div class="warning-heading">
            <div>Overwrite Template</div>
            <div>You’re about to overwrite an <span class="text-danger">existing template</span>. Are you sure?</div>
          </div>
        </template>

      </div>

      <div v-if="!isHideMode">
        <label for="template-name-input">Template name</label>
        <input
            id="template-name-input"
            type="text"
            name="name"
            v-model.trim="template.name"
            ref="nameInput"
            class="form-control"
            :disabled="isUpdateMode"
            data-e2e-type="action-config-template-name-input"
        >
      </div>
    </div>
    <div slot="modal-footer">
      <button
        data-e2e-type="action-config-template-details-cancel-btn"
        class="btn mr-1 btn-secondary action-button"
        @click="hide"
      >
        Cancel
      </button>
      <button
        v-if="isCreateMode"
        class="btn btn-primary action-button"
        :disabled="!isValid"
        @click="submit"
        data-e2e-type="action-config-template-details-save-btn"
      >
        Save
      </button>
      <button
          v-else-if="isHideMode"
          class="btn btn-primary action-button"
          @click="submit"
          data-e2e-type="action-config-template-details-hide-btn"
      >
        Hide Template
      </button>
      <button
          v-else
          class="btn btn-danger action-button"
          @click="submit"
          data-e2e-type="action-config-template-details-overwrite-btn"
      >
        Overwrite
      </button>
    </div>
  </b-modal>
</template>

<script src="./action-config-template-confirm-modal.js"></script>
<style lang="scss" src="./action-config-template-confirm-modal.scss"></style>
