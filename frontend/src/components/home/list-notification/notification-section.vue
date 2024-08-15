<template>
  <div>
    <url-based-breadcrumb :breadcrumb-items-factory="statefulbuildBreadcrumbItems"></url-based-breadcrumb>
    <div class="sections">
      <router-view
        @notification-detail="onShowNotificationDetail"
        @notification-advanced-settings="onShowNotificationAdvancedSettings"
        @section-navigate-previous="navigatePrevious">
      </router-view>
    </div>
  </div>
</template>

<script src="./notification-section.js"></script>
