<template>
  <div>
    <url-based-breadcrumb :breadcrumb-items-factory="statefulbuildBreadcrumbItems" />
    <div class="sections">
      <router-view
        @certification-creation="onCreate"
        @certification-edition="onEdit"
        @section-navigate-previous="navigatePrevious" />
    </div>
  </div>
</template>

<script src="./certification-section.js"></script>