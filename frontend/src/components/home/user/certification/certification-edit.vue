<template>
  <div
    class="pts-grid-edit-modal"
    :class="{'blur-loading-row': httpRequesting}"
    data-e2e-type="certification-edit-container">
      <div slot="default">
        <div class="container-fluid">
          <div class="row align-items-center">
            <div class="col-12 col-md-2">
              <label for="name">Name</label>
            </div>
            <div class="col-12 col-md-10" :class="{'has-danger': errors.has('name')}" v-if="canCreateOrEdit">
              <input
                type="text"
                id="name"
                class="form-control"
                v-model="certification.name"
                v-validate="'required'"
                :class="{'form-control-danger': errors.has('name')}"
                data-e2e-type="name-input">
              <div class="form-control-feedback" v-show="errors.has('name')">Certification name is required.</div>
            </div>
            <div class="col-12 col-md-10" :class="{'has-danger': errors.has('name')}" v-else>
              {{certification.name}}
            </div>
          </div>
          <div class="row align-items-center checkbox-container" v-show="canOnlyEdit">
            <div class="col-11 col-md-2">
              <label for="deleted">Inactive</label>
            </div>
            <div class="col-1 col-md-10">
              <input
                id="deleted"
                type="checkbox"
                class="form-control pts-clickable"
                v-model="certification.deleted"
                data-e2e-type="certification-inactive">
            </div>
          </div>
        </div>
      </div>
      <div slot="modal-footer" class="form-actions">
        <button class="btn btn-secondary pull-right" @click="close">{{cancelText}}</button>
        <span class="pull-right mr-2" v-show="httpRequesting"><i class="fas fa-spin fa-circle-o-notch"></i></span>
        <button
          :disabled="!isValid"
          v-if="canCreateOrEdit"
          v-show="!httpRequesting"
          @click="save"
          class="btn btn-primary pull-right mr-2"
          data-e2e-type="certification-save">Save</button>
      </div>
  </div>
</template>

<script src="./certification-edit.js"></script>
