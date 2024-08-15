<template>
  <div>
    <server-pagination-grid
      ref="notificationGrid"
      grid-name="notificationGrid"
      title=""
      key-prop="_id"
      :service="notificationService"
      :can-setup="canSetup"
      :can-create="canCreate"
      @grid-edit="onShowDetail($event)"
      @grid-setup-action="onSetupAction($event)">
    </server-pagination-grid>
  </div>
</template>

<script src="./notification-grid.js"></script>
