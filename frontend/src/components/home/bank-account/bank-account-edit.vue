<template>
  <div
    class="pts-grid-edit-modal"
    data-e2e-type="bank-account-edit"
    :class="{ 'blur-loading-row': httpRequesting }"
  >
    <div slot="default" data-e2e-type="bank-account-edit-body">
      <div class="container-fluid">
        <div class="form-group row">
          <label class="col-12 col-md-1 col-form-label required">Bank Account ID</label>
          <div class="col-12 col-md-5" :class="{'has-danger': errors.has('no')}">
            <input
              v-model="account.no"
              data-e2e-type="bank-account-id"
              class="form-control"
              type="text"
              name="no"
              v-validate="{ required: true }"
              :disabled="!canCreateOrEdit"
            >
          </div>
        </div>
        <div class="form-group row">
          <label class="col-12 col-md-1 col-form-label required">Bank Account Name</label>
          <div class="col-12 col-md-5" :class="{'has-danger': account.name === '' && errors.has('name')}">
            <input
              class="form-control"
              type="text"
              v-model="account.name"
              name="name"
              data-e2e-type="bank-account-name"
              v-validate="{ required: true }"
              :disabled="!canCreateOrEdit">
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
                  data-e2e-type="bank-account-inactive"
                  v-model="account.deleted"
                  :disabled="!canCreateOrEdit">
              </label>
            </div>
          </div>
        </div>
      </div>
    </div>
    <div slot="modal-footer" class="form-actions">
      <button class="btn btn-secondary pull-right" @click="close">Cancel</button>
      <button class="btn btn-primary pull-right mr-2" :disabled="!isValid" @click="save" v-if="canCreateOrEdit" data-e2e-type="bank-account-save">Save</button>
    </div>
  </div>
</template>

<script src="./bank-account-edit.js"></script>
