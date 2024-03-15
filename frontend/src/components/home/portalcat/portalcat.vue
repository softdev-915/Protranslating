<template>
  <div class="container-fluid w-100 h-100">
    <div class="portalcat" data-e2e-type="portalcat-body" :class="{ 'blur-loading-row': isLoading }">
      <action-files-modal/>
      <action-config-modal ref="actionConfigModal"/>
      <segment-history-modal/>
      <keyboard-shortcuts-modal ref="shortcutsModal"/>
      <lock-config-modal ref="lockConfigModal" />
      <confirm-dialog
        data-e2e-type="portalcat-confirm-dialog"
        :cancelText="confirmDialogCancelText"
        :confirmationMessage="confirmDialogMessage"
        :confirmationTitle="confirmDialogTitle"
        container-class="medium-dialog"
        @confirm="onDialogConfirm"
        ref="confirmDialog" />
      <actions-ui-set
        @action-config="onActionConfig"
        @save-workbench="onSaveWorkbench"
        @keyboard-shortcuts="onShortcutsClicked"
        @lock-segments="onLockSegments">
      </actions-ui-set>
    </div>
    <div id="suggestion-dropdown"></div>
  </div>
</template>

<script src="./portalcat.js"></script>
<style lang="scss" src="./portalcat.scss"></style>
