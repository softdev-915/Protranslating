<template>
  <section-container :title="'LSP Settings'">
    <lsp-section v-if="canReadOrEdit" ref="breadcrumb"></lsp-section>
    <h4 v-if="!canReadOrEdit">You are not authorized to access this resource</h4>
  </section-container>
</template>

<script src="./index.js"></script>