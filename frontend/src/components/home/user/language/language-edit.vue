<template>
  <div
    data-e2e-type="language-inline-edit"
    class="pts-grid-edit-modal language-inline-edit"
    :class="{'blur-loading-row': httpRequesting}"
  >
    <div slot="default">
      <div class="container-fluid">
        <div class="row align-items-center">
          <div class="col-12 col-md-2"><span class="pts-required-field" v-if="canSaveForm">*</span> Name</div>
          <div class="col-12 col-md-10" :class="{'has-danger': errors.has('name')}" v-if="canSaveForm">
            <input
              type="text"
              data-e2e-type="language-form-name"
              id="name"
              name="name"
              class="form-control"
              :class="{'form-control-danger': errors.has('name')}"
              v-model="language.name"
              v-validate="'required'">
            <div class="form-control-feedback" v-show="errors.has('name')" >Language name is required.</div>
          </div>
          <div class="col-12 col-md-10" data-e2e-type="language-name-read-only" :class="{'has-danger': errors.has('name')}" v-else>
            {{language.name}}
          </div>
        </div>
        <div class="row align-items-center">
          <div class="col-12 col-md-2"><span class="pts-required-field" v-if="canSaveForm">*</span> ISO Code</div>
          <div class="col-12 col-md-10" :class="{'has-danger': errors.has('isoCode')}" v-if="canSaveForm">
            <input
              type="text"
              data-e2e-type="language-form-iso-code"
              id="isoCode"
              name="isoCode"
              class="form-control"
              :class="{'form-control-danger': errors.has('isoCode')}"
              v-model="language.isoCode"
              v-validate="'required'">
            <div class="form-control-feedback" v-show="errors.has('isoCode')" >Language isoCode is required.</div>
          </div>
          <div class="col-12 col-md-10" data-e2e-type="language-iso-code-read-only" :class="{'has-danger': errors.has('isoCode')}" v-else>
            {{language.isoCode}}
          </div>
        </div>
        <div class="row align-items-center checkbox-container" v-show="canOnlyEdit">
          <div class="col-11 col-md-2">
            <label for="language-inactive">Inactive</label>
          </div>
          <div class="col-1 col-md-10">
            <input
              type="checkbox"
              data-e2e-type="language-form-inactive"
              id="language-inactive"
              class="form-control pts-clickable"
              v-model="language.deleted">
          </div>
        </div>
      </div>
    </div>
    <div slot="modal-footer" class="form-actions">
      <button class="btn btn-secondary pull-right" @click="close">{{cancelText}}</button>
      <span class="pull-right mr-2" v-show="httpRequesting"><i class="fas fa-spin fa-circle-o-notch"></i></span>
      <button class="btn btn-primary pull-right mr-2" v-show="!httpRequesting" :disabled="!isValid" @click="save" v-if="canSaveForm">Save</button>
    </div>
  </div>
</template>

<script src="./language-edit.js"></script>
