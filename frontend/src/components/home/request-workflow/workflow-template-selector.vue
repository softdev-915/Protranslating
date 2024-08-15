<template>
  <basic-select 
    @click.native="onSelectClick"
    @select="onSelect"
    data-e2e-type="workflow-template-select"
    placeholder="Select Workflow Template"
    :class="{'blur-loading-row' : isLoading}"
    :selected-option="selectedOption"
    :options="templates" />
</template>

<script src="./workflow-template-selector.js"></script>
