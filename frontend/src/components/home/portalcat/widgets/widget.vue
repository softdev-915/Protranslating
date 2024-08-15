<template>
  <div class="portalcat-widget">
    <div class="widget-header" data-e2e-type="portalcat-widget-header">
      <div class="header-content">
        <slot name="icon"></slot>
        <p class="mb-0 ml-1" v-if="headerTitle">{{ headerTitle }}</p>
        <template v-else>
          <slot name="title"></slot>
        </template>
        <div class="widget-menubar mr-3">
          <slot name="menubar"></slot>
        </div>
        <div class="widget-controls">
          <button :disabled="!minimizable" class="fas fa-window-minimize" title="Minimize" @click="$emit('minimize')" data-e2e-type="widget-minimize"></button>
          <button class="fas fa-window-maximize" title="Maximize" @click="$emit('maximize')" data-e2e-type="widget-maximize"></button>
        </div>
      </div>
    </div>
    <div data-e2e-type="portalcat-widget-content" class="widget-content" v-show="!minimized">
      <slot></slot>
    </div>
  </div>
</template>

<script src="./widget.js"></script>
<style lang="scss" src="./widget.scss"></style>