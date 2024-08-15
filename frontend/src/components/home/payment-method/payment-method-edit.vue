<template>
  <div class="pts-grid-edit-modal payment-methods-inline-edit" :class="{'blur-loading-row': httpRequesting}">
    <div slot="default">
      <div class="container-fluid">
        <div class="row align-items-center">
          <div class="col-12 col-md-2"><span class="pts-required-field" v-if="canCreateOrEdit">*</span> Name</div>
          <div class="col-12 col-md-10" v-if="canCreateOrEdit" :class="{'has-danger': !isValid}">
            <input type="text" autofocus class="form-control" data-e2e-type="payment-method-name" v-model.trim="paymentMethod.name">
          </div>
          <div v-else>{{ paymentMethod.name }}</div>
        </div>
        <div class="row align-items-center checkbox-container" v-show="!isNew && canEdit">
          <div class="col-11 col-md-2">
            <label for="payment-method-inactive">Inactive</label>
          </div>
          <div class="col-1 col-md-10">
            <input type="checkbox" id="payment-method-inactive" class="form-control pts-clickable" v-model="paymentMethod.deleted" value="true" data-e2e-type="payment-method-inactive-checkbox">
          </div>
        </div>
      </div>
    </div>
    <div slot="modal-footer" class="form-actions">
      <button class="btn btn-secondary pull-right" @click="cancel">{{cancelText}}</button>
      <button data-e2e-type="payment-method-save" class="btn btn-primary pull-right mr-2" :disabled="!isValid" @click="save" v-if="canCreateOrEdit">Save</button>
    </div>
  </div>
</template>

<script src="./payment-method-edit.js"></script>
