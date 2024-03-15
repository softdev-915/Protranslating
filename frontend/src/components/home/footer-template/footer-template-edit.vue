<template>
  <div class="pts-grid-edit-modal footer-template-inline-edit" :class="{'blur-loading-row': httpRequesting}">
    <div slot="default">
      <div class="container-fluid">
        <div class="row align-items-center">
          <div class="col-12 col-md-2">
            <label for="name">
              Name <span class="pts-required-field">*</span>
            </label>
          </div>
          <div class="col-12 col-md-10" v-if="canCreateOrEdit" :class="{'has-danger': !isValidName}">
            <input type="text" name="name" autofocus class="form-control" data-e2e-type="footer-template-name" v-model.trim="footerTemplate.name">
          </div>
          <div v-else>{{ footerTemplate.name }}</div>
        </div>
        <div class="row align-items-center">
          <div class="col-12 col-md-2">
            <label for="name">
              Description <span class="pts-required-field">*</span>
            </label>
          </div>
          <div class="col-12 col-md-10" v-if="canCreateOrEdit" :class="{'has-danger': !isValidDescription}">
            <input type="text" name="name" autofocus class="form-control" data-e2e-type="footer-template-description" v-model.trim="footerTemplate.description">
          </div>
          <div v-else>{{ footerTemplate.description }}</div>
        </div>
        <div class="row align-items-center checkbox-container" v-show="!isNew && canEdit">
          <div class="col-11 col-md-2">
            <label for="footer-template-inactive">Inactive</label>
          </div>
          <div class="col-1 col-md-10">
            <input type="checkbox" id="footer-template-inactive" class="form-control pts-clickable" v-model="footerTemplate.deleted" value="true" data-e2e-type="footer-template-inactive-checkbox">
          </div>
        </div>
      </div>
    </div>
    <div slot="modal-footer" class="form-actions">
      <button class="btn btn-secondary pull-right" @click="cancel">{{cancelText}}</button>
      <button data-e2e-type="footer-template-save" class="btn btn-primary pull-right mr-2" :disabled="!isValid" @click="save" v-if="canCreateOrEdit">Save</button>
    </div>
  </div>
</template>

<script src="./footer-template-edit.js"></script>
