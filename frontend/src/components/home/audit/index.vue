<template>
  <section-container :title="sectionTitle">
    <audit-section v-if="canRead" ref="breadcrumb"></audit-section>
    <h4 v-if="!canRead">You are not authorized to access this resource</h4>
  </section-container>
</template>

<script src="./index.js"></script>