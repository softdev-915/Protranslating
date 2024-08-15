<template>
  <div class="pts-grid-edit-modal internal-department-inline-edit" :class="{'blur-loading-row': httpRequesting}">
    <div slot="default">
      <div class="container-fluid">
        <div class="row align-items-center">
          <div class="col-12 col-md-2">
            <span class="pts-required-field">*</span>
            Name
          </div>
          <div class="col-12 col-md-10" v-if="canCreateOrEdit" :class="{'has-danger': !IsValidField('name')}">
            <input type="text" name="name" autofocus class="form-control" data-e2e-type="internal-department-name" v-model.trim="internalDepartment.name">
          </div>
          <div v-else>{{ internalDepartment.name }}</div>
        </div>
        <div class="row align-items-center">
          <div class="col-12 col-md-2" data-e2e-type="internal-department-accounting-department-id-label">
            <span class="pts-required-field">*</span>
            Accounting Department ID
          </div>
          <div class="col-12 col-md-10" v-if="canCreateOrEdit" :class="{'has-danger': !IsValidField('accountingDepartmentId')}">
            <input type="text" name="accountingDepartmentId" autofocus class="form-control" data-e2e-type="internal-department-accounting-department-id" v-model.trim="internalDepartment.accountingDepartmentId">
          </div>
          <div v-else data-e2e-type="internal-department-accounting-department-id-read-only">
            {{ internalDepartment.accountingDepartmentId }}
          </div>
        </div>
        <div class="row align-items-center checkbox-container" v-show="!isNew && canEdit">
          <div class="col-11 col-md-2">
            <label for="internal-department-inactive">Inactive</label>
          </div>
          <div class="col-1 col-md-10">
            <input type="checkbox" id="internal-department-inactive" class="form-control pts-clickable" v-model="internalDepartment.deleted" value="true" data-e2e-type="internal-department-inactive-checkbox">
          </div>
        </div>
      </div>
    </div>
    <div slot="modal-footer" class="form-actions">
      <button class="btn btn-secondary pull-right" @click="cancel">{{cancelText}}</button>
      <button data-e2e-type="internal-department-save" class="btn btn-primary pull-right mr-2" :disabled="!isValid" @click="save" v-if="canCreateOrEdit">Save</button>
    </div>
  </div>
</template>

<script src="./internal-department-edit.js"></script>
