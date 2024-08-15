<template>
  <section-container title="Delivery Types">
    <delivery-type-section v-if="canRead"></delivery-type-section>
    <h4 v-else>You are not authorized to access this resource</h4>
  </section-container>
</template>

<script src="./index.js"></script>
