<template>
  <div class="pts-grid-edit-modal tax-form-inline-edit" :class="{'blur-loading-row': httpRequesting}">
    <div>
      <div class="container-fluid">
        <div class="row align-items-center">
          <div class="col-12 col-md-2"><span class="pts-required-field" v-if="canCreateOrEdit">*</span> Name</div>
          <div class="col-12 col-md-10" v-if="canCreateOrEdit" :class="{'has-danger': !isValid}">
            <input type="text" autofocus class="form-control" data-e2e-type="tax-form-name" v-model.trim="taxForm.name">
          </div>
          <div v-else>{{ taxForm.name }}</div>
        </div>
        <div class="row align-items-center checkbox-container">
          <div class="col-12 col-md-2">Tax ID required</div>
          <div class="col-1 col-md-10">
            <input :disabled="!canCreateOrEdit" type="checkbox" class="form-control pts-clickable" v-model="taxForm.taxIdRequired" value="true" data-e2e-type="tax-id-required-checkbox">
          </div>
        </div>
        <div class="row align-items-center checkbox-container" v-show="!isNew && canDelete">
          <div class="col-11 col-md-2">
            <label for="tax-form-inactive">Inactive</label>
          </div>
          <div class="col-1 col-md-10">
            <input type="checkbox" id="tax-form-inactive" class="form-control pts-clickable" data-e2e-type="tax-form-inactive-checkbox" v-model="taxForm.deleted" value="true" >
          </div>
        </div>
      </div>
    </div>
    <div class="form-actions">
      <button class="btn btn-secondary pull-right" @click="cancel">{{cancelText}}</button>
      <button data-e2e-type="tax-form-save" class="btn btn-primary pull-right mr-2" :disabled="!isValid" @click="save" v-if="canCreateOrEdit || canDelete">Save</button>
    </div>
  </div>
</template>

<script src="./tax-form-edit.js"></script>
