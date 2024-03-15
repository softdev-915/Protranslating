<template>
  <div>
    <url-based-breadcrumb :breadcrumb-items-factory="statefulbuildBreadcrumbItems" />
    <div class="sections">
      <router-view @section-navigate-previous="navigatePrevious"/>
    </div>
  </div>
</template>

<script src="./cc-payments-section.js" />