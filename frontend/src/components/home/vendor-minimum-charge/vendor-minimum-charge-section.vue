<template>
  <div>
    <url-based-breadcrumb :breadcrumb-items-factory="statefulbuildBreadcrumbItems"></url-based-breadcrumb>
    <div class="sections">
      <router-view
        @vendor-minimum-charge-creation="onCreate"
        @vendor-minimum-charge-edition="onEdit"
        @section-navigate-previous="navigatePrevious"></router-view>
    </div>
  </div>
</template>

<script src="./vendor-minimum-charge-section.js"></script>
