<template>
  <section-container :title="'company-external-accounting-code management'">
    <company-external-accounting-codes-section v-if="canRead">
    </company-external-accounting-codes-section>
    <h4 v-else>You are not authorized to access this resource</h4>
  </section-container>
</template>

<script src="./index.js"></script>
