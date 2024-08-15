<template>
  <section-container title="Certification management">
    <certification-section v-if="canRead"></certification-section>
    <h4 v-else>You are not authorized to access this resource</h4>
  </section-container>
</template>

<script src="./index.js"></script>