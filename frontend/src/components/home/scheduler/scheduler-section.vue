<template>
  <div>
    <url-based-breadcrumb :breadcrumb-items-factory="statefulbuildBreadcrumbItems"></url-based-breadcrumb>
    <div class="sections">
      <router-view
        @scheduler-edition="onEdit"
        @scheduler-creation="onCreate"
        @section-navigate-previous="navigatePrevious">
      </router-view>
    </div>
  </div>
</template>

<script src="./scheduler-section.js"></script>
