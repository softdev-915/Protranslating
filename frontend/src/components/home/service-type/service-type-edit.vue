<template>
  <div class="pts-grid-edit-modal service-type-inline-edit" :class="{'blur-loading-row': httpRequesting}">
    <div slot="default">
      <div class="container-fluid">
        <div class="row align-items-center">
          <div class="col-12 col-md-2">
            <label for="name">
              Name <span class="pts-required-field">*</span>
            </label>
          </div>
          <div class="col-12 col-md-10" v-if="canCreateOrEdit" :class="{'has-danger': !isValidName}">
            <input type="text" name="name" autofocus class="form-control" data-e2e-type="service-type-name" v-model.trim="serviceType.name">
          </div>
          <div v-else>{{ serviceType.name }}</div>
        </div>
        <div class="row align-items-center">
          <div class="col-12 col-md-2">
            <label for="name">
              Description <span class="pts-required-field">*</span>
            </label>
          </div>
          <div class="col-12 col-md-10" v-if="canCreateOrEdit" :class="{'has-danger': !isValidDescription}">
            <input type="text" name="name" autofocus class="form-control" data-e2e-type="service-type-description" v-model.trim="serviceType.description">
          </div>
          <div v-else>{{ serviceType.description }}</div>
        </div>
        <div class="row align-items-center checkbox-container" v-show="!isNew && canEdit">
          <div class="col-11 col-md-2">
            <label for="service-type-inactive">Inactive</label>
          </div>
          <div class="col-1 col-md-10">
            <input type="checkbox" id="service-type-inactive" class="form-control pts-clickable" v-model="serviceType.deleted" value="true" data-e2e-type="service-type-inactive-checkbox">
          </div>
        </div>
      </div>
    </div>
    <div slot="modal-footer" class="form-actions">
      <button class="btn btn-secondary pull-right" @click="cancel">{{cancelText}}</button>
      <button data-e2e-type="service-type-save" class="btn btn-primary pull-right mr-2" :disabled="!isValid" @click="save" v-if="canCreateOrEdit">Save</button>
    </div>
  </div>
</template>

<script src="./service-type-edit.js"></script>
