<template>
  <div>
    <server-pagination-grid
      class="activeUserSessionsGrid"
      grid-name="activeUserSessionsInlineGrid"
      title="Active User Sessions"
      key-prop="no"
      :cache="true"
      :service="activeUserSessionsService"
      :can-create="false">
    </server-pagination-grid>
  </div>
</template>

<script src="./active-user-sessions-grid.js"></script>
<style lang="scss" scoped src="./active-user-sessions-grid.scss"></style>
