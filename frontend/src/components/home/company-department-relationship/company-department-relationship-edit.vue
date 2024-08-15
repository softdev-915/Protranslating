<template>
  <div
    class="pts-grid-edit-modal company-department-relationship-inline-edit"
    :class="{'blur-loading-row': httpRequesting}"
  >
    <div slot="default">
      <div class="container-fluid">
        <div class="row align-items-center">
          <div class="col-2 col-md-2">
            <label
              for="company-department-realtionship-company"
              data-e2e-type="company-department-relationship-company-label">
              Company
            </label>
          </div>
          <div class="col-10 col-md-10" :class="{'has-danger': !isValidCompany}">
            <company-ajax-basic-select
              :is-disabled="!canCreateOrEdit"
              :fetch-on-created="false"
              :selected-option="selectedCompany"
              @select="onCompanySelect"
              data-e2e-type="company-department-relationship-company"
              placeholder="Company"/>
          </div>
        </div>
        <div class="row align-items-center">
          <div class="col-2 col-md-2">
            <label
              for="company-department-relationship-internal-department"
              data-e2e-type="company-department-relationship-internal-department-label">
              LSP Internal Department
            </label>
          </div>
          <div class="col-10 col-md-10" :class="{'has-danger': !isValidInternalDepartment}">
            <internal-department-selector
              v-model="companyDepartmentRelationship.internalDepartment"
              placeholder="Internal department"
              data-e2e-type="company-department-relationship-internal-department"
              id="company-department-relationship-internal-department"
              :isDisabled="!canCreateOrEdit"
              :retrieve-on-init="true"
              title="Internal departments list"/>
          </div>
        </div>
        <div class="row align-items-center">
          <label
            for="bill-creation-day"
            class="col-2 col-md-2"
            data-e2e-type="company-department-relationship-bill-creation-day-label">
            Bill Creation Day
          </label>
          <div class="col-10 col-md-10" :class="{'has-danger': errors.has('billCreationDay')}">
            <input
              type="number"
              name="billCreationDay"
              :disabled="!canCreateOrEdit"
              class="form-control"
              placeholder="Enter number between 1 and 28"
              data-e2e-type="company-department-relationship-bill-creation-day"
              id="bill-creation-day"
              v-validate="{min_value: billCreationDayMin, max_value: billCreationDayMax}"
              v-model.number="companyDepartmentRelationship.billCreationDay"/>
              <p
                class="form-control-feedback"
                data-e2e-type="bill-creation-day-error-message"
                v-if="errors.has('billCreationDay')">
                Enter number between 1 and 28
              </p>
          </div>
        </div>
        <div class="row align-items-center checkbox-container">
          <div class="col-2 col-md-2">
            <label
              data-e2e-type="company-department-relationship-accept-invoice-per-period-label"
              for="access-invoice-per-period">
              Accept Invoice Per Period
            </label>
          </div>
          <div class="col-10 col-md-10">
            <input
              type="checkbox"
              id="access-invoice-per-period"
              class="form-control pts-clickable"
              v-model="companyDepartmentRelationship.acceptInvoicePerPeriod"
              value="true"
              :disabled="!canCreateOrEdit"
              data-e2e-type="company-department-relationship-access-invoice-per-period-checkbox"
            />
          </div>
        </div>
        <div class="row align-items-center checkbox-container" v-show="!isNew && canCreateOrEdit">
          <div class="col-2 col-md-2">
            <label for="company-department-realtionship-inactive">Inactive</label>
          </div>
          <div class="col-10 col-md-10">
            <input
              type="checkbox"
              id="company-department-realtionship-inactive"
              class="form-control pts-clickable"
              v-model="companyDepartmentRelationship.deleted"
              value="true"
              data-e2e-type="company-department-realtionship-inactive-checkbox"
            />
          </div>
        </div>
      </div>
    </div>
    <div slot="modal-footer" class="form-actions">
      <button class="btn btn-secondary pull-right" @click="cancel">{{cancelText}}</button>
      <button
        data-e2e-type="company-department-realtionship-save"
        class="btn btn-primary pull-right mr-2"
        :disabled="!isValid"
        @click="save"
        v-if="canCreateOrEdit"
      >Save</button>
    </div>
  </div>
</template>

<script src="./company-department-relationship-edit.js"></script>
