<template>
  <div>
    <url-based-breadcrumb :breadcrumb-items-factory="statefulbuildBreadcrumbItems" />
    <div class="sections">
      <router-view
        @connector-edition="onEdit"
        @section-navigate-previous="navigatePrevious" />
    </div>
  </div>
</template>

<script src="./connector-section.js"></script>
