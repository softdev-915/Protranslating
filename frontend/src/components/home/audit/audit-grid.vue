<template>
  <div>
    <server-pagination-grid
      class="auditsGrid"
      grid-name="auditInlineGrid"
      title="Audit"
      key-prop="no"
      :cache="true"
      :service="auditService"
      :can-create="false">
    </server-pagination-grid>
  </div>
</template>

<script src="./audit-grid.js"></script>
<style lang="scss" scoped src="./audit-grid.scss"></style>
