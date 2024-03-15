<template>
  <section-container title="Tax form management">
    <tax-form-section v-if="canRead"></tax-form-section>
    <h4 v-else>You are not authorized to access this resource</h4>
  </section-container>
</template>

<script src="./index.js"></script>
