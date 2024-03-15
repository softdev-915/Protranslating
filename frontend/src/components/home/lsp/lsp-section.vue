<template>
  <div>
    <url-based-breadcrumb :breadcrumb-items-factory="statefulbuildBreadcrumbItems"></url-based-breadcrumb>
    <div class="sections">
      <router-view @section-navigate-previous="navigatePrevious"></router-view>
    </div>
  </div>
</template>

<script src="./lsp-section.js"></script>
