<template>
  <div class="container-fluid" :class="{ 'blur-loading-row': isLoading }" data-e2e-type="print-checks-details-body">
    <div class="row mb-4">
      <div class="col-12">
        <h6>Print Checks</h6>
        <hr class="mb-3">
      </div>
      <div class="col-12 col-md-3">
        <label for="bankAccount" class="d-block">Bank Account<span class="pts-required-field">*</span></label>
        <simple-basic-select
          id="bankAccount"
          v-model="checkDetails.account"
          :options="bankAccounts"
          :format-option="({ _id, name }) => ({ text: name, value: _id })"
          :class="{'has-danger': !isValidBankAccount}"
          placeholder="Bank Account"
          data-e2e-type="account-select"/>
      </div>
      <div class="col-12 col-md-3">
        <label for="nextCheckNo" class="d-block">Next Check #<span class="pts-required-field">*</span></label>
        <input
          id="nextCheckNo"
          type="text"
          class="form-control"
          data-e2e-type="next-check-number"
          :class="{'has-danger': !isValidNextCheckNo}" v-model="checkDetails.nextCheckNo">
      </div>
    </div>
    <div class="row">
      <div class="col-12">
        <h6>Checks to be printed / confirmed</h6>
        <hr class="mb-3">
      </div>
      <div class="col-12">
        <server-pagination-grid
          ref="checkGrid"
          grid-name="apChecks"
          title="AP Checks"
          key-prop="_id"
          data-e2e-type="check-grid"
          :query="checkGridQuery"
          :row-selection="true"
          row-selection-title="Print"
          :service="checkService"
          :components="gridComponents"
          :selected-rows="checkDetails.selectedChecksIdsArray"
          selected-row-check-property="_id"
          :can-create="false"
          :can-export="false"
          @grid-data-loaded="onChecksLoaded"
          @all-rows-selected="onAllRowsSelected"
          @row-selected="onRowSelected">
        </server-pagination-grid>
      </div>
    </div>
    <div class="row justify-content-end mt-5">
      <div class="col-auto">
        <button
          class="btn btn-primary"
          data-e2e-type="print-btn"
          :disabled="!isValid || isLoading" @click="onPrintClick">
          Preview and Print
        </button>
      </div>
    </div>
    <a href="#" class="d-none" ref="downloadLink" target="_blank"></a>
    <confirm-dialog
      @confirm="print"
      ref="confirmDialog"
      confirmationTitle="Reprint checks confirmation"
      confirmationMessage="You have already printed the checks that have assigned check numbers. Check numbers cannot be changed once the check is printed. Would you like to continue?"/>
  </div>
</template>

<script src="./ap-print-checks-details.js"></script>
<style lang="scss" src="./ap-print-checks-details.scss"></style>