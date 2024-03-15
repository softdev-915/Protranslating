<template>
  <div class="pts-grid-edit-modal cat-tool-inline-edit" :class="{'blur-loading-row': httpRequesting}">
    <div slot="default">
      <div class="container-fluid">
        <div class="row align-items-center">
          <div class="col-12 col-md-2"><span class="pts-required-field" v-if="canCreateOrEdit">*</span> Name</div>
          <div class="col-12 col-md-10" :class="{'has-danger': errors.has('name')}" v-if="canCreateOrEdit">
            <input type="text" data-e2e-type="cat-tool-name" id="name" name="name" class="form-control" :class="{'form-control-danger': errors.has('name')}" v-model="catTool.name" v-validate="'required'">
            <div class="form-control-feedback" v-show="errors.has('name')" >Translation Tool name is required.</div>
          </div>
          <div class="col-12 col-md-10" :class="{'has-danger': errors.has('name')}" v-else>
            {{catTool.name}}
          </div>
        </div>
        <div class="row align-items-center checkbox-container" v-show="canOnlyEdit">
          <div class="col-11 col-md-2">
            <label for="cat-inactive">Inactive</label>
          </div>
          <div class="col-1 col-md-10">
            <input type="checkbox" id="cat-inactive" data-e2e-type="cat-tool-inactive" class="form-control pts-clickable" v-model="catTool.deleted" value="true" >
          </div>
        </div>
      </div>
    </div>
    <div slot="modal-footer" class="form-actions">
      <button class="btn btn-secondary pull-right" @click="close">{{cancelText}}</button>
      <span class="pull-right mr-2" v-show="httpRequesting"><i class="fas fa-spin fa-circle-o-notch"></i></span>
      <button data-e2e-type="cat-tool-save" class="btn btn-primary pull-right mr-2" v-show="!httpRequesting" :disabled="!isValid" @click="validateBeforeSubmit" v-if="canCreateOrEdit">Save</button>
    </div>
  </div>
</template>

<script src="./cat-tool-edit.js"></script>
