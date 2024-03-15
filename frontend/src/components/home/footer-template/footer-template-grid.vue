<template>
  <server-pagination-grid
    ref="FooterTemplateGrid"
    grid-name="footerTemplate"
    title="Footer Template Grid"
    key-prop="name"
    :service="footerTemplateService"
    :can-create="canCreate"
    :can-export="false"
    @grid-edit="onEdit($event)"
    @grid-create-new="onCreateNew($event)">
  </server-pagination-grid>
</template>

<script src="./footer-template-grid.js"></script>
