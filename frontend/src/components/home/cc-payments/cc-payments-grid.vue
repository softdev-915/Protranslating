<template>
  <div>
    <server-pagination-grid
      grid-name="ccPayments"
      title="Credit Card Payments"
      key-prop="_id"
      :can-create="false"
      :service="service"
    />
  </div>
</template>

<script src="./cc-payments-grid.js" />