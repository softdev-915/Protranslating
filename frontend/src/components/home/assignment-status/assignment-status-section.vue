<template>
  <div>
    <url-based-breadcrumb :breadcrumb-items-factory="statefulbuildBreadcrumbItems"></url-based-breadcrumb>
    <div class="sections">
      <router-view
        @assignment-status-creation="onCreate"
        @assignment-status-edition="onEdit"
        @section-navigate-previous="navigatePrevious"></router-view>
    </div>
  </div>
</template>

<script src="./assignment-status-section.js"></script>
