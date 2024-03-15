<template>
  <section-container title="Service Types">
    <service-type-section v-if="canRead"></service-type-section>
    <h4 v-else>You are not authorized to access this resource</h4>
  </section-container>
</template>

<script src="./index.js"></script>
