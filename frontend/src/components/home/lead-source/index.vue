<template>
  <section-container title="Lead source management">
    <lead-source-section v-if="canRead"></lead-source-section>
    <h4 v-else>You are not authorized to access this resource</h4>
  </section-container>
</template>

<script src="./index.js"></script>
