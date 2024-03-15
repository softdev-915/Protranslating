<template>
  <div>
    <url-based-breadcrumb :breadcrumb-items-factory="statefulbuildBreadcrumbItems" />
    <div class="sections">
      <router-view
        @company-minimum-charge-creation="onCreate"
        @company-minimum-charge-edition="onEdit"
        @company-minimum-charge-creation-clone="onCreateClone"
        @section-navigate-previous="navigatePrevious" />
    </div>
  </div>
</template>

<script src="./company-minimum-charge-section.js"></script>
