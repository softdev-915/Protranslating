<template>
  <section-container title="Software requirement management">
    <software-requirement-section v-if="canRead"></software-requirement-section>
    <h4 v-else>You are not authorized to access this resource</h4>
  </section-container>
</template>

<script src="./index.js"></script>
