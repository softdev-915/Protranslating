<template>
  <div>
    <url-based-breadcrumb :breadcrumb-items-factory="statefulbuildBreadcrumbItems"></url-based-breadcrumb>
    <div class="sections">
      <router-view
        @toast-edit="onToastEdit"
        @toast-create="onToastCreate"
        @section-navigate-previous="navigatePrevious">
      </router-view>
    </div>
  </div>
</template>

<script src="./toast-section.js"></script>
