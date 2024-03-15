<template>
  <section-container title="Import entities">
    <import-entities-section v-if="canRead"></import-entities-section>
    <h4 v-else>You are not authorized to access this resource</h4>
  </section-container>
</template>

<script src="./index.js"></script>