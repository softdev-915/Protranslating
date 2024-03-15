<template>
  <div class="pts-grid-edit-modal ip-instructions-deadline-inline-edit" :class="{ 'blur-loading-row': httpRequesting }">
    <div slot="default">
      <div class="container-fluid">
        <div class="row align-items-center">
          <div class="col-12 col-md-2">
            <span class="pts-required-field" v-if="canCreateOrEdit">*</span>
            Total or Claims Word Count
          </div>
          <div class="col-12 col-md-10" v-if="canCreateOrEdit" :class="{ 'has-danger': !isValid }">
            <input type="text" name="deadline" autofocus class="form-control" placeholder="Example: 0 - 2000 (Do not use commas)"
              data-e2e-type="total-or-claims-word-count" v-model.trim="ipInstructionsDeadline.totalOrClaimsWordCount">
          </div>
          <div v-else>{{ ipInstructionsDeadline.totalOrClaimsWordCount }}</div>
        </div>
        <div class="row align-items-center">
          <div class="col-12 col-md-2">
            <span class="pts-required-field" v-if="canCreateOrEdit">*</span>
            Notice Period
          </div>
          <div class="col-12 col-md-10" v-if="canCreateOrEdit" :class="{ 'has-danger': !isValid }">
            <input type="text" name="notice" autofocus class="form-control" placeholder="Example: 1 or 2 weeks"
              data-e2e-type="ip-instructions-notice-period" v-model.trim="ipInstructionsDeadline.noticePeriod">
          </div>
          <div v-else>{{ ipInstructionsDeadline.noticePeriod }}</div>
        </div>
        <div class="row align-items-center checkbox-container" v-show="!isNew && canEdit">
          <div class="col-11 col-md-2">
            <label for="ip-instructions-deadline-inactive">Inactive</label>
          </div>
          <div class="col-1 col-md-10">
            <input type="checkbox" id="ip-instructions-deadline-inactive" class="form-control pts-clickable"
              v-model="ipInstructionsDeadline.deleted" value="true"
              data-e2e-type="ip-instructions-deadline-inactive-checkbox">
          </div>
        </div>
      </div>
    </div>
    <div slot="modal-footer" class="form-actions mt-2">
      <button class="btn btn-secondary pull-right" @click="cancel">{{ cancelText }}</button>
      <button data-e2e-type="ip-instructions-deadline-save" class="btn btn-primary pull-right mr-2" :disabled="!isValid"
        @click="save" v-if="canCreateOrEdit">Save</button>
    </div>
  </div></template>

<script src="./ip-instructions-deadline-edit.js"></script>
