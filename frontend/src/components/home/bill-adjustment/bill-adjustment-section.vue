<template>
  <div>
    <url-based-breadcrumb :breadcrumb-items-factory="statefulbuildBreadcrumbItems"></url-based-breadcrumb>
    <div class="sections">
      <router-view
        @bill-adjustment-details="onBillAdjustmentEdit"
        @bill-adjustment-creation="onBillAdjustmentCreate"
        @section-navigate-previous="navigatePrevious"></router-view>
    </div>
  </div>
</template>

<script src="./bill-adjustment-section.js"></script>
