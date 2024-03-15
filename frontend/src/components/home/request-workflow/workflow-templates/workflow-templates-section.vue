<template>
  <section class="row container-fluid mb-4">
    <div v-if="canReadTemplates" class="col-12 col-md-4">
      <button
        data-e2e-type="template-select-toggle"
        class="btn btn-new-optional w-100"
        :disabled="!canToggleTemplatesSelector"
        @click="toggleTemplateSelector"
      >
        {{ templateButtonText }}
        <i
          v-if="!doesTemplateApplied"
          class="fas pull-right"
          :class="isSelectVisible ? 'fa-chevron-up' : 'fa-chevron-down'" 
        />
      </button>
      <workflows-template-select
        data-e2e-type="workflow-templates-selector"
        class="mt-2"
        v-if="isSelectVisible && canToggleTemplatesSelector"
        :company-id="request.company._id"
        :language-combinations="requestLanguageCombinations"
        @input="applyTemplate"
      />
    </div>
    <div v-if="canCreateTemplates" class="col-12 col-md-3">
      <button
        data-e2e-type="template-create-button"
        :disabled="isCreateButtonDisabled"
        class="btn btn-new-optional w-100"
        @click="prepareTemplate"
      >
        Save Selected Workflows As Template
      </button>
    </div>
    <lms-modal v-model="isSaveModalShown" data-e2e-type="workflow-template-create-modal">
      <h5 class="mb-2">Save Template</h5>
      <div class="row align-items-center">
        <div class="col-12 form-group" data-e2e-type="new-wf-template-name-container" :class="{ 'has-danger': doesNamesExceedsMaxLength }">
          <label>Template Name</label>
          <input
            data-e2e-type="new-wf-template-name"
            type="text" 
            class="form-control"
            v-model="templateName">
          <span 
            v-if="doesNamesExceedsMaxLength" 
            class="red-text ml-2">Keyword must not exceed 128 character
          </span>
        </div>
        <div class="col-12 form-group">
          <label>Language Combinations</label>
          <textarea 
            disabled 
            type="text" 
            class="form-control" 
            data-e2e-type="new-wf-template-languages"
            v-model="languageCombinations" />
        </div>
      </div>
      <div class="row justify-content-end">
        <button
          data-e2e-type="cancel-wf-template-save-button"
          class="btn btn-new-optional" 
          @click="closeSaveModal">Cancel</button>
        <button
          data-e2e-type="save-wf-template-button"
          class="mx-2 btn btn-new-primary"
          :disabled="!isTemplateNameValid"
          @click="() => saveTemplate()">Save</button>
      </div>
      
    </lms-modal>
    <lms-confirm-modal v-model="modal"/>
  </section>
</template>

<script src="./workflow-template-section.js" />