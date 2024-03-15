<template>
  <div>
    <url-based-breadcrumb :breadcrumb-items-factory="statefulbuildBreadcrumbItems"></url-based-breadcrumb>
    <div class="sections">
      <router-view
        @language-edition="onEdit"
        @language-creation="onCreate"
        @section-navigate-previous="navigatePrevious">
      </router-view>
    </div>
  </div>
</template>

<script src="./language-section.js"></script>
