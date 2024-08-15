<template>
  <section-container :title="'Provider instructions management'">
    <provider-instructions-section v-if="canRead"></provider-instructions-section>
    <h4 v-else>You are not authorized to access this resource</h4>
  </section-container>
</template>

<script src="./index.js"></script>
