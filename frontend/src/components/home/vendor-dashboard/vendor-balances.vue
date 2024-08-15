<template>
  <div class="vendor-balances col-md px-5 py-3">
    <h6 class="d-inline-block mr-4">Vendor Balances</h6>
    <hr class="mt-1 mb-4" />
    <div
      class="d-flex justify-content-between my-3"
    >
      <span>Vendor Total Balance Amount</span>
      <span data-e2e-type="vendor-dashboard-total-bill-balance">{{ totalBalanceAmount }}</span>
    </div>
    <div class="total-amount-by-date mt-5">
      <div class="row">
        <div class="col"></div>
        <div class="col">
          <p class="text-center">Period to apply</p>
        </div>
        <div class="col"></div>
      </div>
      <div class="row my-3">
        <div class="col">
          <label>Total Amount Posted</label>
        </div>
        <div class="col">
          <div data-e2e-type="vendor-dashboard-total-amount-posted-date-range" class="total-amount-posted-filter">
            <input
              type="text"
              class="form-control"
              :disabled="!canEditDateRange"
              :value="totalAmountPostedDateFilter"
              @click="showDateRangeForAmountPosted"
              @keydown.enter="applyDateFilter"
              @keydown.delete="resetDateRangeTotalAmountPosted"
              readonly />
            <!-- do not propagate click events from inside this component to the body -->
            <dynamic-utc-range-flatpickr
              class="date-picker border border-dark rounded"
              v-show="showDateRangeTotalAmountPosted"
              v-model="totalAmountPostedDateFilter"
              :allowed-ranges="allowedDateRanges"
              @apply="applyDateFilter" />
          </div>
        </div>
        <div class="col">
          <span data-e2e-type="vendor-dashboard-total-amount-posted" class="d-block text-right">{{ totalAmountPosted }}</span>
        </div>
      </div>
      <div class="row my-3">
        <div class="col">
          <label>Total Amount Paid</label>
        </div>
        <div class="col">
          <div data-e2e-type="vendor-dashboard-total-amount-paid-date-range" class="total-amount-paid-filter">
            <input
              type="text"
              class="form-control"
              :disabled="!canEditDateRange"
              :value="totalAmountPaidDateFilter"
              @click="showDateRangeForAmountPaid"
              @keydown.enter="applyDateFilter"
              @keydown.delete="resetDateRangeTotalAmountPaid"
              readonly />
            <!-- do not propagate click events from inside this component to the body -->
            <dynamic-utc-range-flatpickr
              class="date-picker border border-dark rounded"
              v-show="showDateRangeTotalAmountPaid"
              v-model="totalAmountPaidDateFilter"
              :allowed-ranges="allowedDateRanges"
              @apply="applyDateFilter" />
          </div>
        </div>
        <div class="col">
          <span data-e2e-type="vendor-dashboard-total-amount-paid" class="d-block text-right">{{ totalAmountPaid }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script src="./vendor-balances.js"></script>