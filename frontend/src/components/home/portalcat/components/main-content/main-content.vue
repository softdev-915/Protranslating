<template>
  <div class="portalcat-main-content" data-e2e-type="portalcat-main-content">
    <div class="nooverflow">
      <multipane
        class="main-pane"
        layout="vertical"
        @paneResizeStop="onSidePaneResizeStop"
        @paneResize="onSidePaneResize">
        <div
          ref="sidePane"
          class="pane side"
          :class="{ minimized: isLeftSideMinimized }"
          :style="{ width: leftWidth }"
          data-e2e-type="portalcat-left-side">
          <panes-builder
            :widgets="leftSideWidgets"
            side="leftSide"
            :is-left-minimized="isLeftSideMinimized"
            @config-change="$emit('input', $event)"
            @action-config="$emit('action-config', $event)"
            @drag="handleDrag"
            @minimize="onMinimize"
            @maximize="onMaximize"
            @paneResizeStop="onPaneResizeStop"
            @paneResize="onPaneResize"/>
        </div>
        <multipane-resizer data-e2e-type="main-pane-resizer"/>
        <div class="pane" style="flex: 1;" data-e2e-type="portalcat-main-section">
          <panes-builder
            :widgets="mainWidgets"
            @config-change="$emit('input', $event)"
            @lock-segments="$emit('lock-segments')"
            @drag="handleDrag"
            @minimize="onMinimize"
            @maximize="onMaximize"
            @paneResizeStop="onPaneResizeStop"
            @paneResize="onPaneResize"/>
        </div>
      </multipane>
    </div>
  </div>
</template>

<script src="./main-content.js"></script>
<style lang="scss" src="./main-content.scss"></style>
