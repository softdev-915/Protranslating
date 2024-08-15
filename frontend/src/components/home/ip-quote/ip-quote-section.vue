<template>
  <div class="pb-5 ip-quote-container">
    <url-based-breadcrumb :breadcrumb-items-factory="statefulbuildBreadcrumbItems"></url-based-breadcrumb>
    <div class="sections">
      <router-view></router-view>
    </div>
  </div>
</template>

<script src="./ip-quote-section.js"></script>
