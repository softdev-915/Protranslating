<template>
  <div>
    <url-based-breadcrumb :breadcrumb-items-factory="statefulbuildBreadcrumbItems" />
    <div :class="sectionClass" class="sections">
      <router-view
        @invoice-creation="onCreate"
        @invoice-edition="onEdit"
        @invoice-preview="onPreview"
        @invoice-activity-grid="onActivityGrid"
        @activity-edition="onActivityEdition"
        @invoice-activity-creation="onActivityCreation"
        @section-navigate-root="navigateRoot"
        @section-navigate-previous="navigatePrevious"
      />
    </div>
  </div>
</template>
<script src="./ar-invoice-section.js"></script>
