<template>
  <div class="w-100">
    <div class="text-primary ml-1 mb-2">Ap Payments</div>
    <div class="table-container">
      <table class="table-sm table pts-data-table table-stacked table-hover table-striped table-bordered scroll">
        <thead class="hidden-sm-down">
          <tr>
            <th v-for="(c, i) in tableColumns" :key="i">{{c}}</th>
          </tr>
        </thead>
        <tbody>
            <tr
              v-for="(apPayment, index) in apPayments"
              :key="index"
              data-e2e-type="ap-payments-table-row"
            >
              <td> {{apPayment.paymentDate}} </td>
              <td> {{ apPayment.paymentAmount }} </td>
              <td> {{ apPayment.appliedCredits }} </td>
              <td> {{ apPayment.vendorName }} </td>
            </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script src="./ap-payment-table.js"></script>
