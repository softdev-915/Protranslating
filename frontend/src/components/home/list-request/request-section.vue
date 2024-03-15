<template>
  <div>
    <url-based-breadcrumb @breadcrumb-click="nav" :breadcrumb-items-factory="statefulbuildBreadcrumbItems" />
    <div :class="sectionClass" class="sections">
      <router-view
        @request-creation="onCreate"
        @request-edition="onEdit"
        @activity-edition="onActivityEdition"
        @activity-creation="onActivityCreation"
        @activity-list="onActivityList"
        @section-navigate-root="navigateRoot"
        @section-navigate-previous="navigatePrevious"
      />
    </div>
  </div>
</template>

<script src="./request-section.js"></script>
