<template>
  <b-modal size="lg" hide-header-close ref="modal" @close="cancel()" data-e2e-type="add-language-combination-modal">
    <div slot="modal-header">
      <h6>Add language combination</h6>
    </div>
    <div slot="default">
      <div class="container-fluid">
        <div class="row align-items-center">
          <label class="col-12 col-md-2 form-check-label" data-e2e-type="mt-settings-languages-label">
            Language Combinations
            <span class="pts-required-field">*</span>
          </label>
          <div class="col-12 col-md-8">
            <language-combination-select
              data-e2e-type="mt-settings-language-combinations"
              v-model="languageCombinations"/>
          </div>
        </div>
      </div>
    </div>
    <div slot="modal-footer">
      <button class="btn mr-1 btn-primary" :disabled="!isValid" @click.prevent="save" data-e2e-type="mt-settings-save-combinations">Save</button>
      <button class="btn btn-secondary" @click.prevent="hide">Cancel</button>
    </div>
  </b-modal>
</template>

<script src="./add-language-combination-modal.js"></script>
