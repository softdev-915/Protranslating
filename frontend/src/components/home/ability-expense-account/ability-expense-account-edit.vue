<template>
  <div
    class="pts-grid-edit-modal ability-expense-account-inline-edit"
    :class="{'blur-loading-row': httpRequesting}"
  >
    <div slot="default">
      <div class="container-fluid">
        <div class="row align-items-center">
          <div class="col-12 col-md-2">Expense Account</div>
          <div class="col-12 col-md-10" v-if="canCreateOrEdit" :class="{'has-danger': !isValidExpenseAccount}">
            <basic-select
              :selected-option="selectedExpenseAccount"
              @select="onExpenseAccountSelect"
              placeholder="Expense Account"
              :options="expenseAccountOptions"
              data-e2e-type="ability-expense-account"
            ></basic-select>
          </div>
          <div v-else data-e2e-type="ability-expense-account-read-only">{{ selectedExpenseAccount.text }}</div>
        </div>
        <div class="row align-items-center">
          <div class="col-12 col-md-2">
             <label
              for="ability-expense-account-ability"
              data-e2e-type="ability-expense-account-ability-label">
              Ability
            </label>
          </div>
          <div class="col-12 col-md-10" v-if="canCreateOrEdit">
            <ability-selector
              :class="{'has-danger': !isValidAbility}"
              v-model="selectedAbility"
              placeholder="Ability"
              title="Abilities list"
              data-e2e-type="ability-expense-account-ability"
              id="ability-expense-account-ability"
              :fetch-on-created="false"/>
          </div>
          <div v-else data-e2e-type="ability-expense-account-ability-read-only">{{ selectedAbility.text }}</div>
        </div>
        <div class="row align-items-center checkbox-container" v-show="!isNew && canEdit">
          <div class="col-11 col-md-2">
            <label
              for="ability-expense-account-inactive"
              data-e2e-type="ability-expense-account-inactive-label">
              Inactive
            </label>
          </div>
          <div class="col-1 col-md-10">
            <input
              type="checkbox"
              id="ability-expense-account-inactive"
              class="form-control pts-clickable"
              v-model="abilityExpenseAccount.deleted"
              value="true"
              data-e2e-type="ability-expense-account-inactive-checkbox"
            />
          </div>
        </div>
      </div>
    </div>
    <div slot="modal-footer" class="form-actions">
      <button class="btn btn-secondary pull-right" @click="cancel">{{cancelText}}</button>
      <button
        data-e2e-type="ability-expense-account-save"
        class="btn btn-primary pull-right mr-2"
        :disabled="!isValid"
        @click="save"
        v-if="canCreateOrEdit"
      >Save</button>
    </div>
  </div>
</template>

<script src="./ability-expense-account-edit.js"></script>
