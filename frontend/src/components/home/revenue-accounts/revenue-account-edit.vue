<template>
  <div
    class="pts-grid-edit-modal"
    data-e2e-type="account-edit"
    :class="{ 'blur-loading-row': httpRequesting }"
  >
    <div slot="default" data-e2e-type="account-edit-body">
      <div class="container-fluid">
        <div class="form-group row">
          <label class="col-12 col-md-1 col-form-label required">Number</label>
          <div class="col-12 col-md-5" :class="{'has-danger': errors.has('no')}">
            <input
              class="form-control"
              data-e2e-type="account-number"
              type="number"
              v-model.number="account.no"
              name="no"
              :disabled="!canCreateOrEdit"
              v-validate="{ required: true, regex: /^\d+$/ }">
          </div>
        </div>
        <div class="form-group row">
          <label class="col-12 col-md-1 col-form-label required">Name</label>
          <div class="col-12 col-md-5" :class="{'has-danger': errors.has('name')}">
            <input
              class="form-control"
              type="text"
              v-model="account.name"
              name="name"
              :disabled="!canCreateOrEdit"
              data-e2e-type="account-name"
              v-validate="'required'">
          </div>
        </div>
        <div class="form-group row">
          <label class="col-2 col-md-1">Inactive</label>
          <div class="col-5">
            <div class="form-check">
              <label class="form-check-label">
                <input
                  class="form-check-input"
                  type="checkbox"
                  :disabled="!canCreateOrEdit"
                  data-e2e-type="account-inactive"
                  v-model="account.deleted">
              </label>
            </div>
          </div>
        </div>
      </div>
    </div>
    <div slot="modal-footer" class="form-actions">
      <button class="btn btn-secondary pull-right" @click="close">Cancel</button>
      <button class="btn btn-primary pull-right mr-2" :disabled="!isValid" v-if="canCreateOrEdit" @click="save">Save</button>
    </div>
  </div>
</template>

<script src="./revenue-account-edit.js"></script>
