<template>
  <div class="pts-grid-edit-modal" data-e2e-type="request-type-edit-main-container" :class="{'blur-loading-row': httpRequesting}">
    <div slot="default" data-e2e-type="request-type-edit-container">
      <div class="container-fluid">
        <div class="row align-items-center">
          <div class="col-12 col-md-2">Name</div>
          <div class="col-12 col-md-10" :class="{'has-danger': errors.has('name')}" v-if="canCreateOrEdit">
            <input type="text" data-e2e-type="request-type-name" id="name" name="name" class="form-control" :class="{'form-control-danger': errors.has('name')}" v-model="requestType.name" v-validate="'required'">
            <div class="form-control-feedback" v-show="errors.has('name')">Request Type name is required.</div>
          </div>
          <div class="col-12 col-md-10" :class="{'has-danger': errors.has('name')}" v-else>
            {{requestType.name}}
          </div>
        </div>
        <div class="row align-items-center checkbox-container" v-show="canOnlyEdit">
          <div class="col-11 col-md-2">
            <label for="language-inactive">Inactive</label>
          </div>
          <div class="col-1 col-md-10">
            <input type="checkbox" id="language-inactive" data-e2e-type="request-type-inactive" class="form-control pts-clickable" v-model="requestType.deleted" value="true" >
          </div>
        </div>
      </div>
    </div>
    <div slot="modal-footer" class="form-actions">
      <button class="btn btn-secondary pull-right" data-e2e-type="request-type-cancel" @click="close">{{cancelText}}</button>
      <span class="pull-right mr-2" v-show="httpRequesting"><i class="fas fa-spin fa-circle-o-notch"></i></span>
      <button class="btn btn-primary pull-right mr-2" data-e2e-type="request-type-save" v-show="!httpRequesting" :disabled="!isValid" @click="save" v-if="canCreateOrEdit">Save</button>
    </div>
  </div>
</template>

<script src="./request-type-edit.js"></script>
