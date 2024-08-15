<template>
  <div class="portalcat-pipeline" data-e2e-type="portalcat-pipeline" :class="{ disabled: isDisabled, loading: isLoading }">
    <div class="pipeline-header">
      <div class="row justify-content-between">
        <div class="col col-auto">
          <span class="task-name font-weight-bold">{{ titleToDisplay | capitalize }}</span>
        </div>
        <div class="col col-auto" v-if="!isDisabled">
          <a @click="onExpandCollapseClicked">
            <i class="pts-clickable fas" :class="isExpanded ? 'fa-compress' : 'fa-expand'"></i>
          </a>
        </div>
      </div>
    </div>
    <div class="pipeline-content clearfix" v-show="isExpanded && !isDisabled">
      <div v-if="isMT" class="mb-2">
        <div>
          Engine: <span class="font-italic" data-e2e-type="mt-pipeline-engine">{{ this.engineName }}</span>
        </div>
        <div>
          Model: <span class="font-italic" data-e2e-type="mt-pipeline-model">{{ this.modelName }}</span>
        </div>
      </div>
      <div class="statusbar ml-4">
        <div class="status mr-2">
          <i v-if="isError" class="fas fa-exclamation" :title="`Error Pipeline Execution: ${pipelineMessage}`"></i>
          <i v-else-if="isStopped" class="fas fa-hourglass-start" title="Pending Pipeline Actions"></i>
          <i v-else-if="isInProgress" class="fas fa-spinner in-progress" title="In Progress"></i>
          <i v-else class="fas fa-check" title="Pipeline Completed Successfully"></i>
        </div>
        <div class="pipeline-control-scope">
          <div class="d-inline" data-e2e-type="pipeline-control-scope">
            <input
              :disabled="isLoading || isInProgress"
              type="radio"
              :name="`${pipelineType}-pipeline-control-scope`"
              :id="`${pipelineType}-pipeline-control-scope-request`"
              value="request"
              v-model="runScope">
            <label :for="`${pipelineType}-pipeline-control-scope-request`">request files</label>
          </div>
          <div class="d-inline" data-e2e-type="pipeline-control-scope">
            <input
              :disabled="isLoading || isInProgress"
              type="radio"
              :name="`${pipelineType}-pipeline-control-scope`"
              :id="`${pipelineType}-pipeline-control-scope-task`"
              value="task"
              v-model="runScope">
            <label :for="`${pipelineType}-pipeline-control-scope-task`">task files</label>
          </div>
          <div class="d-inline" data-e2e-type="pipeline-control-scope">
            <input
              :disabled="isLoading || isInProgress"
              type="radio"
              :name="`${pipelineType}-pipeline-control-scope`"
              :id="`${pipelineType}-pipeline-control-scope-current`"
              value="file"
              v-model="runScope">
            <label :for="`${pipelineType}-pipeline-control-scope-current`">current file</label>
          </div>
        </div>
        <button v-if="!isInProgress" :disabled="!canRun || isLoading" type="button" class="pipeline-control ml-2 fas fa-play" title="Run Pipeline(s)" @click="onRunPipelines"></button>
        <button v-else :disabled="!canRun || isLoading" type="button" class="pipeline-control ml-2 fas fa-stop" title="Stop Pipeline(s)" @click="onStopPipeline"></button>
      </div>
      <div class="row justify-content-end">
        <div class="col-auto">
          <a
            v-if="!isDownloading"
            :aria-disabled="!isDownloadsAvailable || isLoading || isInProgress"
            :tabindex="isDownloadsAvailable ? 0 : -1"
            :class="{ disabled: !isDownloadsAvailable || isLoading || isInProgress }"
            href="#"
            class="btn btn-link btn-sm download"
            title="Download All Actions Files"
            data-e2e-type="download-all-actions-files"
            @click.prevent="downloadAllFiles">
            <i class="fas fa-download"></i>
          </a>
          <i v-else class="fas fa-spinner fa-pulse fa-fw"></i>
          <a href="#" class="d-none" ref="downloadLink"></a>
        </div>
      </div>
      <action
        class="ml-4 mb-1"
        v-for="action of currentActions"
        :key="action._id"
        :action="action"
        :isInProgress="isInProgress"
        :pipelineId="pipelineId"
        @action-config="$emit('action-config', { action: $event, pipeline })">
      </action>
    </div>
  </div>
</template>

<script src="./pipeline.js"></script>
<style lang="scss" scoped src="./pipeline.scss"></style>
