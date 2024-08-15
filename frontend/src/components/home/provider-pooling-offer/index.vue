<template>
  <section-container title="Provider Pooling Offers">
    <provider-pooling-offer-section v-if="canRead"></provider-pooling-offer-section>
    <h4 v-else>You are not authorized to access this resource</h4>
  </section-container>
</template>

<script src="./index.js"></script>
