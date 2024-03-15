<template>
  <div class="pts-grid-edit-modal" data-e2e-type="external-resource" :class="{'blur-loading-row': httpRequesting}">
    <div class="container-fluid">
        <div class="row">
          <div v-if="(!canEdit || !editing) && !noContent" class="col-12" data-e2e-type="external-resource-html" v-html="externalResource.html"></div>
          <div v-if="(!canEdit || !editing) && noContent" class="col-12" data-e2e-type="external-resource-no-content">
            No content yet
          </div>
          <div v-else-if="canEdit && editing" class="col-12" data-e2e-type="external-resource-text-editor">
            <rich-text-editor v-model="externalResource.html" placeholder="External resource"></rich-text-editor>
          </div>
        </div>
    </div>
    <div class="form-actions" v-if="canEdit" v-show="!saving" data-e2e-type="external-resource-edit-buttons">
      <button class="btn btn-primary pull-right mr-2" data-e2e-type="external-resource-edit" @click="edit" v-show="canEdit && !editing">Edit</button>
      <button class="btn btn-secondary pull-right" data-e2e-type="external-resource-cancel" @click="cancel" v-show="canEdit && editing">Cancel</button>
      <button class="btn btn-primary pull-right mr-2" data-e2e-type="external-resource-save" @click="save" v-show="canEdit && editing">Save</button>
    </div>
  </div>
</template>

<script src="./external-resources.js"></script>
