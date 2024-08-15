<template>
  <div data-e2e-type="action-config-modal">
    <b-modal size="lg" hide-header-close :no-fade="true" ref="bModal" :id="modalId" :closeOnBackdrop="false" class="action-config-modal">
      <div slot="modal-header">
        <strong>{{ actionName }}</strong> action config
      </div>
      <div slot="default">
        <p class="text-center" v-if="isLoadingConfig && !configYaml">
          <i class="fas fa-spinner in-progress"></i>
        </p>
        <div v-else-if="configYaml">
          <textarea :disabled="!canApply || isLoadingConfig" class="config-editor" spellcheck="false" v-model="configYaml"></textarea>
        </div>
      </div>
      <div slot="modal-footer" class="row w-100 no-gutters align-items-center">
        <div class="col row no-gutters align-items-center">
          <div class="col-4">
            <ajax-basic-select
              data-e2e-type="action-config-template-select"
              v-if="actionName"
              :is-disabled="!canApply"
              :key="selectedTemplate._id"
              placeholder="Action Config Templates"
              :http-client="retrieveTemplates"
              :selected-option="selectedTemplate"
              @select="onTemplateSelect"
              ref="templateSelect"/>
          </div>
          <div class="col-auto">
            <button
              data-e2e-type="template-save-button"
              class="btn btn-primary ml-4 mr-2"
              type="button"
              :disabled="!canSave"
              @click="onSaveClick">
              <i v-if="isSavingConfig" class="fas fa-spinner in-progress"></i>
              Save
            </button>
            <button
                data-e2e-type="template-hide-button"
                class="btn btn-secondary"
                v-if="isHideButtonVisible"
                @click="onHideClick"
                :disabled="!canHideTemplate"
                type="button">
              Hide template
            </button>
            <button
                data-e2e-type="delete-all-templates-button"
                class="btn btn-danger"
                v-if="isTestEnvironment && canHideTemplate"
                @click="onDeleteClick"
                type="button">
              Delete all Templates
            </button>
          </div>
        </div>
        <div class="col-auto ml-auto">
          <button
              data-e2e-type="action-config-close-button"
              class="btn btn-secondary mx-1 cancel"
              type="button"
              @click="closeModal(modalId)">
            Close
          </button>
          <button
            data-e2e-type="template-apply-button"
            class="btn apply-btn btn-primary mx-1"
            type="button"
            :disabled="!canApply"
            @click="onApply">
            <i v-if="isApplyingConfig" class="fas fa-spinner in-progress"></i>
            Apply
          </button>
        </div>
      </div>
    </b-modal>
    <action-config-template-confirm-modal
        mode="create"
        ref="confirmTemplateCreationModal"
        @submit="onTemplateSaveClick"/>
    <action-config-template-confirm-modal
        mode="update"
        ref="confirmTemplateOverwritingModal"
        @submit="onTemplateOverwrite"/>
    <action-config-template-confirm-modal
        mode="hide"
        ref="confirmTemplateHidingModal"
        @submit="onTemplateHide"/>
  </div>
</template>

<script src="./action-config-modal.js"></script>
<style lang="scss">
.action-config-modal {
  .modal-dialog {
    max-width: 900px;
  }

  textarea {
    width: 100%;
    height: 600px;
  }
}
</style>
