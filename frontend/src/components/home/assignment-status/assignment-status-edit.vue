<template>
  <div class="pts-grid-edit-modal assignment-status-inline-edit" :class="{'blur-loading-row': httpRequesting}">
    <div slot="default">
      <div class="container-fluid">
        <div class="row align-items-center">
          <div class="col-12 col-md-2">Name</div>
          <div class="col-12 col-md-10" v-if="canCreateOrEdit" :class="{'has-danger': !isValid}">
            <input type="text" autofocus class="form-control" data-e2e-type="assignment-status-name" v-validate="'required'" v-model.trim="assignmentStatus.name">
          </div>
          <div v-else>{{ assignmentStatus.name }}</div>
        </div>
        <div class="row align-items-center checkbox-container" v-show="!isNew && canEdit">
          <div class="col-11 col-md-2">
            <label for="assignment-status-inactive">Inactive</label>
          </div>
          <div class="col-1 col-md-10">
            <input type="checkbox" id="assignment-status-inactive" class="form-control pts-clickable" v-model="assignmentStatus.deleted" value="true" data-e2e-type="assignment-status-inactive-checkbox">
          </div>
        </div>
      </div>
    </div>
    <div slot="modal-footer" class="form-actions">
      <button class="btn btn-secondary pull-right" @click="cancel">{{cancelText}}</button>
      <button data-e2e-type="assignment-status-save" class="btn btn-primary pull-right mr-2" :disabled="!isValid" @click="save" v-if="canCreateOrEdit">Save</button>
    </div>
  </div>
</template>

<script src="./assignment-status-edit.js"></script>
