<template>
  <div class="pts-grid-edit-modal billing-terms-inline-edit" :class="{'blur-loading-row': httpRequesting}">
    <div slot="default">
      <div class="container-fluid">
        <div class="row align-items-center">
          <div class="col-12 col-md-1">Name</div>
          <div class="col-12 col-md-11" v-if="canCreateOrEdit"  :class="{'has-danger': errors.has('name')}">
            <input type="text" v-validate="'required'" name="name" autofocus class="form-control" data-e2e-type="billing-term-name" v-model.trim="billingTerm.name">
          </div>
          <div v-else>{{ billingTerm.name }}</div>
        </div>
        <div class="row align-items-center">
          <div class="col-12 col-md-1">Days</div>
          <div class="col-12 col-md-11" :class="{'has-danger': errors.has('days')}" v-if="canCreateOrEdit">
            <input
              type="number"
              data-e2e-type="billing-term-days"
              class="form-control"
              v-model.number="billingTerm.days"
              name="days"
              v-validate="'numeric'"
              min="0">
            <p
              class="form-control-feedback"
              data-e2e-type="billing-term-days-error-message"
              v-if="errors.firstByRule('days', 'numeric')">
              Please Enter Numeric Value
            </p>
          </div>
          <div v-else data-e2e-type="billing-term-days-read-only">
            {{ billingTerm.days }}
          </div>
        </div>
        <div class="row align-items-center checkbox-container" v-show="!isNew && canEdit">
          <div class="col-11 col-md-1">
            <label for="billing-term-inactive">Inactive</label>
          </div>
          <div class="col-1 col-md-11">
            <input type="checkbox" class="form-control pts-clickable" v-model="billingTerm.deleted" value="true" data-e2e-type="billing-term-inactive-checkbox" id="billing-term-inactive">
          </div>
        </div>
      </div>
    </div>
    <div class="form-actions">
      <button class="btn btn-secondary pull-right" @click="cancel">{{cancelText}}</button>
      <button data-e2e-type="billing-term-save" class="btn btn-primary pull-right mr-2" :disabled="!isValid" @click="save" v-if="canCreateOrEdit">Save</button>
    </div>
  </div>
</template>

<script src="./billing-term-edit.js"></script>
