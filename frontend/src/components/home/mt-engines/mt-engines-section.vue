<template>
  <div>
    <url-based-breadcrumb :breadcrumb-items-factory="statefulbuildBreadcrumbItems"></url-based-breadcrumb>
    <div class="sections">
      <router-view
        @mt-engine-creation="onCreate"
        @mt-engine-edition="onEdit"
        @section-navigate-previous="navigatePrevious"></router-view>
    </div>
  </div>
</template>

<script src="./mt-engines-section.js"></script>
