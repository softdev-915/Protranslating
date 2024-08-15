<template>
  <div>
    <url-based-breadcrumb @breadcrumb-click="nav" :breadcrumb-items-factory="statefulbuildBreadcrumbItems" />
    <div :class="sectionClass" class="sections">
      <router-view
        @quote-creation="onCreate"
        @quote-edition="onEdit"
        @section-navigate-root="navigateRoot"
        @section-navigate-previous="navigatePrevious"
      />
    </div>
  </div>
</template>
<script src="./quote-section.js"></script>
