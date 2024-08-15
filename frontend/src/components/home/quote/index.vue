<template>
  <section-container :title="'Quotes'" :class="quoteSectionClass">
    <quote-section v-if="canRead" ref="breadcrumb"></quote-section>
    <h4 v-if="!canRead">You are not authorized to access this resource</h4>
  </section-container>
</template>

<script src="./index.js"></script>