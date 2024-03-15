<template>
  <section-container title="Dashboard">
    <contact-dashboard-section v-if="canRead"></contact-dashboard-section>
    <h4 v-else>You are not authorized to access this resource</h4>
  </section-container>
</template>

<script src="./index.js"></script>