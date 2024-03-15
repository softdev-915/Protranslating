<template>
  <div
    class="pts-grid-edit-modal expense-account-inline-edit"
    :class="{'blur-loading-row': httpRequesting}">
    <div slot="default">
      <div class="container-fluid">
        <div class="row align-items-center">
          <div class="col-12 col-md-2"><span class="pts-required-field">*</span> Name</div>
          <div class="col-12 col-md-10" v-if="canCreateOrEdit" :class="{'has-danger': errors.has('name')}">
            <input
              type="text"
              name="name"
              autofocus
              class="form-control"
              data-e2e-type="expense-account-name"
              v-model="expenseAccount.name"
              v-validate="'required'"
            />
          </div>
          <div v-else>{{ expenseAccount.name }}</div>
        </div>
        <div class="row align-items-center">
          <div class="col-12 col-md-2"><span class="pts-required-field">*</span> Number</div>
          <div class="col-12 col-md-10" v-if="canCreateOrEdit" :class="{'has-danger': errors.has('number')}">
            <input
              type="text"
              name="number"
              autofocus
              class="form-control"
              data-e2e-type="expense-account-number"
              v-model.trim="expenseAccount.number"
              v-validate="'required'"
            />
          </div>
          <div v-else>{{ expenseAccount.number }}</div>
        </div>
        <div class="row align-items-center">
          <div class="col-12 col-md-2">Cost type</div>
          <div class="col-12 col-md-10" v-if="canCreateOrEdit" :class="{'has-danger': !isValidCostType}">
            <basic-select
              :selected-option="selectedCostType"
              @select="onCostTypeSelect"
              placeholder="Cost type"
              :options="costTypeOptions"
              data-e2e-type="expense-account-cost-type"
            ></basic-select>
          </div>
          <div v-else>{{ expenseAccount.costType }}</div>
        </div>
        <div class="row align-items-center checkbox-container" v-show="!isNew && canEdit">
          <div class="col-11 col-md-2">
            <label for="expense-account-inactive">Inactive</label>
          </div>
          <div class="col-1 col-md-10">
            <input
              type="checkbox"
              id="expense-account-inactive"
              class="form-control pts-clickable"
              v-model="expenseAccount.deleted"
              value="true"
              data-e2e-type="expense-account-inactive-checkbox"
            />
          </div>
        </div>
        <!-- increase height of page -->
        <div style="margin-bottom: 100px"></div>
      </div>
    </div>
    <div slot="modal-footer" class="form-actions">
      <button class="btn btn-secondary pull-right" @click="cancel">{{cancelText}}</button>
      <button
        data-e2e-type="expense-account-save"
        class="btn btn-primary pull-right mr-2"
        :disabled="!isValid"
        @click="save"
        v-if="canCreateOrEdit"
      >Save</button>
    </div>
  </div>
</template>

<script src="./expense-account-edit.js"></script>
