<template>
  <section-container :title="'vendor-minimum-charge management'">
    <vendor-minimum-charge-section v-if="canRead"></vendor-minimum-charge-section>
    <h4 v-else>You are not authorized to access this resource</h4>
  </section-container>
</template>

<script src="./index.js"></script>
