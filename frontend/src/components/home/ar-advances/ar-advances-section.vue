<template>
   <div>
    <url-based-breadcrumb :breadcrumb-items-factory="statefulbuildBreadcrumbItems" />
    <div class="sections">
      <router-view 
        :can-create="canCreate"
        :can-edit="canEdit"
        @section-navigate-previous="navigatePrevious"/>
    </div>
  </div>
</template>

<script src="./ar-advances-section.js">