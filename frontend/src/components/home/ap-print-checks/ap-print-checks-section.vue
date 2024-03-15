<template>
  <div>
    <url-based-breadcrumb :breadcrumb-items-factory="buildBreadcrumbItems"></url-based-breadcrumb>
    <div class="sections">
      <router-view></router-view>
    </div>
  </div>
</template>

<script src="./ap-print-checks-section.js"></script>
