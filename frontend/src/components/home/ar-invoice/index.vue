<template>
  <section-container title="Invoice">
    <invoice-section v-if="canRead" ref="breadcrumb"></invoice-section>
    <h4 v-if="!canRead">You are not authorized to access this resource</h4>
  </section-container>
</template>

<script src="./index.js"></script>
