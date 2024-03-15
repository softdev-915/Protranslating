<template>
  <section-container title="External Resources">
    <external-resources-section v-if="canRead"></external-resources-section>
    <h4 v-else>You are not authorized to access this resource</h4>
  </section-container>
</template>

<script src="./index.js"></script>
