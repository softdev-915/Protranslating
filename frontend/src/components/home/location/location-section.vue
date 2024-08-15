<template>
  <div>
    <url-based-breadcrumb :breadcrumb-items-factory="statefulbuildBreadcrumbItems" />
    <div class="sections">
      <router-view
        @location-creation="onCreate"
        @location-edition="onEdit"
        @section-navigate-previous="navigatePrevious" />
    </div>
  </div>
</template>

<script src="./location-section.js"></script>
