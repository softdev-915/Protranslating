<template>
  <section-container title="Lead source management">
    <opportunity-section v-if="canRead"></opportunity-section>
    <h4 v-else>You are not authorized to access this resource</h4>
  </section-container>
</template>

<script src="./index.js"></script>
