<template>
  <section-container title="Dashboard">
    <vendor-dashboard-section v-if="canRead"></vendor-dashboard-section>
    <h4 v-else>You are not authorized to access this resource</h4>
  </section-container>
</template>

<script src="./index.js"></script>