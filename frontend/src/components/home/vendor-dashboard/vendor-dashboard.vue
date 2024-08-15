<template>
  <div
    data-e2e-type="vendor-dashboard-container"
    class="container-fluid"
    :class="{'blur-loading-row': isLoading }" >
    <div class="row">
      <tasks-info :dashboardData="dashboardData" />
      <vendor-balances
        :dashboardData="dashboardData"
        :dateFilterAmountPosted="dateFilterAmountPosted"
        :dateFilterAmountPaid="dateFilterAmountPaid"
        :defaultFilter="defaultFilter"
        @set-date-filter-amount-posted="dateFilterAmountPosted = $event"
        @set-date-filter-amount-paid="dateFilterAmountPaid = $event"
        @apply-date-filter="getDashboardData"/>
    </div>
  </div>
</template>

<script src="./vendor-dashboard.js"></script>
<style lang="scss" src="./vendor-dashboard.scss" />
