<template>
  <section-container title="location management">
    <location-section v-if="canRead"></location-section>
    <h4 v-else>You are not authorized to access this resource</h4>
  </section-container>
</template>

<script src="./index.js"></script>
