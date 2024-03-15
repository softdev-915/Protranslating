<template>
  <div>
    <url-based-breadcrumb :breadcrumb-items-factory="statefulbuildBreadcrumbItems"></url-based-breadcrumb>
    <div class="sections">
      <router-view
        @tax-form-creation="onCreate"
        @tax-form-edition="onEdit"
        @section-navigate-previous="navigatePrevious"></router-view>
    </div>
  </div>
</template>

<script src="./tax-form-section.js"></script>
