<template>
  <div
    class="pts-grid-edit-modal company-external-accounting-codes-inline-edit"
    :class="{'blur-loading-row': httpRequesting}"
  >
    <div slot="default">
      <div class="container-fluid">
        <div class="row align-items-center">
          <div class="col-2 col-md-2">
            <label
              for="company-external-accounting-code"
              data-e2e-type="company-external-accounting-code-label">
              Company External Accounting Code
            </label>
          </div>
          <div class="col-10 col-md-10" :class="{'has-danger': !isValidCompanyExternalAccountingCode}">
            <input
              type="text"
              name="name"
              data-e2e-type="company-external-accounting-code"
              id="company-external-accounting-code"
              autofocus
              placeholder="Company External Accounting Code"
              class="form-control"
              :disabled="!canCreateOrEdit"
              v-model.trim="companyExternalAccountingCode.companyExternalAccountingCode">
          </div>
        </div>
        <div class="row align-items-center">
          <div class="col-2 col-md-2">
            <label
              for="company-external-accounting-code-company"
              data-e2e-type="company-external-accounting-code-company-label">
              Company
            </label>
          </div>
          <div class="col-10 col-md-10" :class="{'has-danger': !isValidCompany}">
            <company-ajax-basic-select
              :is-disabled="!canCreateOrEdit"
              :fetch-on-created="false"
              :selected-option="selectedCompany"
              @select="onCompanySelect"
              data-e2e-type="company-external-accounting-code-company"
              :filter="{deleted: true}"
              placeholder="Company"/>
          </div>
        </div>
        <div class="row align-items-center checkbox-container">
          <div class="col-2 col-md-2">
            <label for="company-external-accounting-code-inactive">Inactive</label>
          </div>
          <div class="col-10 col-md-10">
            <input
              type="checkbox"
              id="company-external-accounting-code-inactive"
              class="form-control pts-clickable"
              v-model="companyExternalAccountingCode.deleted"
              value="true"
              :disabled="!canCreateOrEdit"
              data-e2e-type="company-external-accounting-code-inactive-checkbox"
            />
          </div>
        </div>
      </div>
    </div>
    <div slot="modal-footer" class="form-actions">
      <button class="btn btn-secondary pull-right" @click="close">{{cancelText}}</button>
      <button
        data-e2e-type="company-external-accounting-code-save"
        class="btn btn-primary pull-right mr-2"
        :disabled="!isValid"
        @click="save"
        v-if="canCreateOrEdit"
      >Save</button>
    </div>
  </div>
</template>

<script src="./company-external-accounting-codes-edit.js"></script>
