<template>
  <div class="pb-5 ip-order-container">
    <url-based-breadcrumb :breadcrumb-items-factory="statefulbuildBreadcrumbItems"></url-based-breadcrumb>
    <div class="sections">
      <router-view
        @internal-department-creation="onCreate"
        @internal-department-edition="onEdit"
        @section-navigate-previous="navigatePrevious"></router-view>
    </div>
  </div>
</template>

<script src="./ip-order-section.js"></script>
