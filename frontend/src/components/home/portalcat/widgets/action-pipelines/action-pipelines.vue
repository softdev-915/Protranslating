<template>
  <widget v-on="$listeners" v-bind="widgetProps" data-e2e-type="portalcat-actionpipelines-widget">
    <template slot="icon">
      <i :class="iconClass" title="Settings" data-e2e-type="widget-icon"></i>
    </template>

    <pipeline
      v-if="importPipeline"
      @expand-collapse="onPipelineExpandCollapse"
      @action-config="$emit('action-config', $event)"
      :pipeline="importPipeline"
      :isDisabled="!canReadPipelines || isReflowTask"
      :isExpanded="importPipeline._id === expandedPipeline"/>
    <pipeline
      v-if="mtPipeline"
      @expand-collapse="onPipelineExpandCollapse"
      @action-config="$emit('action-config', $event)"
      :pipeline="mtPipeline"
      title="Machine Translation"
      :isDisabled="!canRunMtPipeline || !canReadPipelines || isReflowTask"
      :isExpanded="mtPipeline._id === expandedPipeline"/>
    <pipeline
      v-if="exportPipeline"
      @expand-collapse="onPipelineExpandCollapse"
      @action-config="$emit('action-config', $event)"
      :pipeline="exportPipeline"
      :isDisabled="!isReflowTask || !canReadPipelines"
      :isExpanded="exportPipeline._id === expandedPipeline"/>
  </widget>
</template>

<script src="./action-pipelines.js"></script>
<style lang="scss" src="./action-pipelines.scss"></style>
