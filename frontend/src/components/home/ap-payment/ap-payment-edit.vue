<template>
  <div
    data-e2e-type="ap-payment-edit-container"
    class="pts-grid-edit-modal bill-edit"
    :class="{'blur-loading-row': httpRequesting}">
    <div slot="default">
      <div class="container-fluid pl-4">
        <div class="row align-items-center">
          <div class="col-12 col-md-3" >
            <label for="paymentDate">
              <span class="pts-required-field">*</span> Payment date
            </label>
            <div :class="{'has-danger': !isValidPaymentDate}">
              <utc-flatpickr
                :value="localPaymentDate"
                :config="datepickerOptions"
                @input="onPaymentDateChange($event)"
                class="form-control"
                :class="{'form-control-danger': !isValidPaymentDate}"
                data-e2e-type="payment-date" />
            </div>
          </div>
          <div class="col-12 col-md-3">
            <label for="paymentMethod">Payment method</label>
            <div :class="{'has-danger': !isValidPaymentMethod}">
              <payment-method-selector
                id="paymentMethod"
                :disabled="!canCreate"
                data-e2e-type="payment-method-select"
                v-model="selectedPaymentMethod"
                placeholder="Payment method"
                title="Payment's method list">
              </payment-method-selector>
            </div>
          </div>
          <div class="col-12 col-md-3">
            <label for="bankAccount">Bank account</label>
            <div :class="{'has-danger': !isValidBankAccount}">
              <simple-basic-select
                id="bankAccount"
                v-model="apPayment.bankAccount"
                :options="bankAccounts"
                :format-option="({ _id, name }) => ({ text: name, value: _id })"
                :filter-option="({ deleted }) => !deleted"
                :disabled="!canCreate"
                data-e2e-type="bank-account-select"
              />
            </div>
          </div>
        </div>
        <div class="row align-items-center">
          <div class="col-12 col-md-3">
            <label for="budgetAmount">Budget amount</label>
            <div :class="{'read-only-currency': !canCreate }">
              <currency-input
                id="budgetAmount"
                title="Budget amount"
                :class="{'disabled-v-money': !canCreate }"
                :currency="null"
                :disabled="!canCreate"
                v-model="apPayment.budgetAmount"
                aria-label="Budget amount"
                class="form-control"
                data-e2e-type="budget-amount"/>
            </div>
          </div>
          <div class="col-12 col-md-3" :class="{'has-danger': !isValidSummaryPayment}">
            <label for="subtotalCreditsApplied">Subtotal credits applied</label>
            <input
              id="subtotalCreditsApplied"
              :value="subtotalCreditsApplied"
              type="text"
              disabled="true"
              class="form-control"
              data-e2e-type="sub-total-credits-applied"/>
          </div>
          <div class="col-12 col-md-3" :class="{ 'has-danger': !isValidRemainingBudgetAmount }">
            <label for="remainingBudgetAmount">
              Remaining budget amount
            </label>
            <input
              id="remainingBudgetAmount"
              type="text"
              disabled="true"
              name="remainingBudgetAmount"
              :value="remainingBudgetAmount.toFixed(2)"
              class="form-control"
              data-e2e-type="remaining-budget-amount"/>
          </div>
              <div class="col-12 col-md-3" :class="{'has-danger': !isValidSummaryPayment}">
            <label for="paymentAmount">
              Payment amount
            </label>
            <input
              id="paymentAmount"
              disabled="true"
              type="text"
              :value="paymentAmount"
              class="form-control"
              data-e2e-type="ap-payment-amount"/>
          </div>
        </div>
        <div class="row">
          <div class="col-12">
            <button
              :disabled="isPaymentBeingCreated"
              data-e2e-type="show-entries-btn"
              class="btn btn-secondary pull-right mr-2"
              @click="isVisibleAccountPayableGrid = !isVisibleAccountPayableGrid">
              {{ isVisibleAccountPayableGrid ? 'Hide' : 'Show' }} entries
            </button>
            <button
              v-show="!wasCsvImported && !isPaymentBeingCreated && apPayment.status !== 'posted'"
              data-e2e-type="import-entries-btn"
              class="btn btn-secondary pull-right mr-2"
              @click="triggerEntriesUpload">
              Import entries
            </button>
            <form ref="importEntriesForm" type="hidden">
              <input type="file" name="entriesCsvFile" class="hidden" accept=".csv" @change="uploadCsvWithEntries($event)" ref="csvEntriesImportedFile" />
            </form>
          </div>
        </div>
        <div class="row mt-4 align-items-center">
          <div class="col-12">
            <account-payable-grid
              v-show="isVisibleAccountPayableGrid"
              data-e2e-type="account-payable"
              :selected-payment-method="selectedPaymentMethod"
              :query="apGridQuery"
              :selected-rows="selectedAccountsPayableIdList"
              @grid-data-imported="onGridDataImported"
              @all-rows-selected="toggleAllAccountsPayable"
              @row-selected="toggleAccountPayable"
            />
          </div>
        </div>
      </div>
    </div>
    <div slot="modal-footer" class="form-actions mt-2">
      <button data-e2e-type="bill-close-button" class="btn btn-secondary pull-right" @click="cancel">Close</button>
      <button
        data-e2e-type="bill-save"
        class="btn btn-primary pull-right mr-2"
        :disabled="!isValid"
        @click="save"
        v-if="canCreate"
      >Save</button>
    </div>
  </div>
</template>

<style lang="scss" src="./ap-payment-edit.scss" scoped></style>
<script src="./ap-payment-edit.js"></script>
