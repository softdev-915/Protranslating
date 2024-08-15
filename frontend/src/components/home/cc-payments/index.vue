<template>
  <section-container title="CC Payments">
    <cc-payments-section v-if="canRead" />
    <h4 v-else>You are not authorized to access this resource</h4>
  </section-container>
</template>
<script src="./index.js" />