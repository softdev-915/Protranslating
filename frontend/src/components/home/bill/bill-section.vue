<template>
  <div>
    <url-based-breadcrumb :breadcrumb-items-factory="statefulbuildBreadcrumbItems" />
    <div :class="sectionClass" class="sections">
      <router-view
        @bill-edition="onEdit"
        @bill-preview="onPreview"
        @section-navigate-previous="navigatePrevious"
      />
    </div>
  </div>
</template>
<script src="./bill-section.js"></script>
