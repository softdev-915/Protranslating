<template>
  <section-container title="Delivery method management">
    <delivery-method-section v-if="canRead"></delivery-method-section>
    <h4 v-else>You are not authorized to access this resource</h4>
  </section-container>
</template>

<script src="./index.js"></script>
