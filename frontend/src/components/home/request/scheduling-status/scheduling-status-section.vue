<template>
  <div>
    <url-based-breadcrumb :breadcrumb-items-factory="statefulbuildBreadcrumbItems"></url-based-breadcrumb>
    <div class="sections">
      <router-view
        @scheduling-status-edit="onSchedulingStatusEdit"
        @scheduling-status-create="onSchedulingStatusCreate"
        @section-navigate-previous="navigatePrevious">
      </router-view>
    </div>
  </div>
</template>

<script src="./scheduling-status-section.js"></script>
