<template>
  <section-container :title="'Tag management'">
    <activity-tag-section ref="userBreadcrumb" v-if="canRead"></activity-tag-section>
    <h4 v-else>You are not authorized to access this resource</h4>
  </section-container>
</template>

<script src="./index.js"></script>
