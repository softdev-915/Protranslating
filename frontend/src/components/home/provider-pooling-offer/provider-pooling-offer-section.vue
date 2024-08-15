<template>
  <div>
    <url-based-breadcrumb :breadcrumb-items-factory="buildBreadcrumbItems"></url-based-breadcrumb>
    <div class="sections">
      <router-view
        @ppo-edit="onEdit"
        @section-navigate-previous="navigatePrevious"></router-view>
    </div>
  </div>
</template>

<script src="./provider-pooling-offer-section.js"></script>
