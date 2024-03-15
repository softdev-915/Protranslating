<template>
  <ip-modal
    :width="`${width}px`"
    :height="`${height}px`"
    :data-e2e-type="dataE2eType"
    v-model="isOpened">
    <template slot="header">
      <slot name="header">
        <span>Warning!</span>
      </slot>
    </template>
    <div class="ip-modal-body">
      <div class="ip-modal-body__message"><slot></slot></div>
      <div class="d-flex justify-content-center mt-4">
        <ip-button
          :data-e2e-type="`ip-${modalType}-reject-button`"
          @click.native="cancel"
        >No</ip-button>
        <ip-button
          class="ml-2"
          type="filled"
          :data-e2e-type="`ip-${modalType}-confirm-button`"
          @click.native="confirm"
        >Yes</ip-button>
      </div>
    </div>
  </ip-modal>
</template>
<script src='./patent-confirm-dialog.js'></script>