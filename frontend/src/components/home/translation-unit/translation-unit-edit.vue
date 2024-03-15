<template>
  <div class="pts-grid-edit-modal translation-unit-inline-edit" :class="{'blur-loading-row': httpRequesting}">
    <div slot="default">
      <div class="container-fluid">
        <div class="row align-items-center">
          <div class="col-12 col-md-2"><span class="pts-required-field" v-if="canCreateOrEdit">*</span> Name</div>
          <div class="col-12 col-md-10" v-if="canCreateOrEdit" :class="{'has-danger': !isValid}">
            <input type="text" name="name" autofocus class="form-control" data-e2e-type="translation-unit-name" v-model.trim="translationUnit.name">
          </div>
          <div v-else>{{ translationUnit.name }}</div>
        </div>
        <div class="row align-items-center checkbox-container" v-show="!isNew && canEdit">
          <div class="col-11 col-md-2">
            <label for="translation-unit-inactive">Inactive</label>
          </div>
          <div class="col-1 col-md-10">
            <input type="checkbox" id="translation-unit-inactive" class="form-control pts-clickable" v-model="translationUnit.deleted" value="true" data-e2e-type="translation-unit-inactive-checkbox">
          </div>
        </div>
      </div>
    </div>
    <div slot="modal-footer" class="form-actions mt-2">
      <button class="btn btn-secondary pull-right" @click="cancel">{{cancelText}}</button>
      <button data-e2e-type="unit-save" class="btn btn-primary pull-right mr-2" :disabled="!isValid" @click="save" v-if="canCreateOrEdit">Save</button>
    </div>
  </div>
</template>

<script src="./translation-unit-edit.js"></script>
