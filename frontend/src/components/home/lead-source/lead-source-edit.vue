<template>
  <div class="pts-grid-edit-modal lead-source-inline-edit" :class="{'blur-loading-row': httpRequesting}">
    <div>
      <div class="container-fluid">
        <div class="row align-items-center">
          <div class="col-12 col-md-2">Name</div>
          <div class="col-12 col-md-10" v-if="canCreateOrEdit" :class="{'has-danger': !isValid}">
            <input type="text" autofocus class="form-control" data-e2e-type="lead-source-name" v-model.trim="leadSource.name">
          </div>
          <div v-else>{{ leadSource.name }}</div>
        </div>
        <div class="row align-items-center checkbox-container" v-show="!isNew && canDelete">
          <div class="col-11 col-md-2">Inactive</div>
          <div class="col-1 col-md-10">
            <input type="checkbox" class="form-control pts-clickable" data-e2e-type="lead-source-inactive-checkbox" v-model="leadSource.deleted" value="true" >
          </div>
        </div>
      </div>
    </div>
    <div class="form-actions">
      <button class="btn btn-secondary pull-right" @click="cancel">{{cancelText}}</button>
      <button data-e2e-type="lead-source-save" class="btn btn-primary pull-right mr-2" :disabled="!isValid" @click="save" v-if="canCreateOrEdit || canDelete">Save</button>
    </div>
  </div>
</template>

<script src="./lead-source-edit.js"></script>
