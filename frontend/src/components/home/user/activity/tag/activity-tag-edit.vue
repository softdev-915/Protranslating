<template>
  <div class="pts-grid-edit-modal tag-inline-edit" data-e2e-type="activity-tag-container" :class="{'blur-loading-row': httpRequesting}">
    <div slot="default">
      <div class="container-fluid">
        <div class="row align-items-center">
          <div class="col-12 col-md-2">
            <label for="name">Name</label>
          </div>
          <div class="col-12 col-md-10" :class="{'has-danger': errors.has('name')}" v-if="canCreateOrEdit">
            <input data-e2e-type="activity-tag-name" type="text" id="name" name="name" class="form-control" :class="{'form-control-danger': errors.has('name')}" v-model="activityTag.name" v-validate="'required'">
            <div class="form-control-feedback" v-show="errors.has('name')">Tag name is required.</div>
          </div>
          <div class="col-12 col-md-10" :class="{'has-danger': errors.has('name')}" v-else>
            {{activityTag.name}}
          </div>
        </div>
        <div class="row align-items-center checkbox-container" v-show="canOnlyEdit">
          <div class="col-11 col-md-2">
            <label id="deleted">Inactive</label>
          </div>
          <div class="col-1 col-md-10">
            <input for="deleted" type="checkbox" class="form-control pts-clickable" v-model="activityTag.deleted" value="true">
          </div>
        </div>
      </div>
    </div>
    <div slot="modal-footer" class="form-actions">
      <button class="btn btn-secondary pull-right" @click="close">{{cancelText}}</button>
      <span class="pull-right mr-2" v-show="httpRequesting"><i class="fas fa-spin fa-circle-o-notch"></i></span>
      <button class="btn btn-primary pull-right mr-2" v-show="!httpRequesting" :disabled="!isValid" @click="save" v-if="canCreateOrEdit">Save</button>
    </div>
  </div>
</template>

<script src="./activity-tag-edit.js"></script>
