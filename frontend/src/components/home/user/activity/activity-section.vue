<template>
  <div>
    <url-based-breadcrumb :breadcrumb-items-factory="statefulbuildBreadcrumbItems"></url-based-breadcrumb>
    <div class="sections">
      <router-view @activity-edition="onEdit"
        @activity-creation="onCreate"
        @activity-tag-manage="onActivityTagManage"
        @activity-tag-edition="onActivityTagEdit"
        @activity-tag-creation="onActivityTagCreate"
        @user-manage="onUserManage"
        @user-edition="onUserEdit"
        @user-creation="onUserCreate"
        @section-navigate-previous="navigatePrevious"></router-view>
    </div>
  </div>
</template>

<script src="./activity-section.js"></script>
