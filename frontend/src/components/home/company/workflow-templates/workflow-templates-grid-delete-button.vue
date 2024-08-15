<template>
  <div class="row justify-content-center align-items-center">
    <input 
      type="checkbox"
      data-e2e-type="workflow-template-state-checkbox"
      :checked="item.deleted" 
      @click="deleteTemplate" 
      :key="item.deleted">
  </div>
</template>

<script src="./workflow-templates-grid-delete-button.js"/>