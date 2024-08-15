<template>
  <div>
    <url-based-breadcrumb :breadcrumb-items-factory="buildBreadcrumbItems"></url-based-breadcrumb>
    <div class="sections">
      <vendor-dashboard></vendor-dashboard>
    </div>
  </div>
</template>

<script src="./vendor-dashboard-section.js"></script>