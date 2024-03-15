<template>
  <div>
    <url-based-breadcrumb :breadcrumb-items-factory="statefulbuildBreadcrumbItems"/>
    <div class="sections">
      <router-view
        @section-navigate-previous="navigatePrevious"
        @custom-query-creation="onCustomQueryCreation()"
        @custom-query-edition="onCustomQueryEdition"/>
    </div>
  </div>
</template>

<script src="./custom-query-section.js"></script>
