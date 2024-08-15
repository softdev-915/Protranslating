<template>
  <div class="segment-history-item" data-e2e-type="memory-editor-history-item">
    <div class="row">
      <div class="col">
        <p class="m-0" v-html="targetTextDisplayed" data-e2e-type="history-item-target"></p>
      </div>
      <div class="col-auto">
        <a href="#" @click.prevent="toggleExpanded" class="btn btn-link" data-e2e-type="history-item-expand-btn">
          <i class="fas" :class="isExpanded ? 'fa-chevron-up' : 'fa-chevron-down'"></i>
        </a>
      </div>
    </div>
    <div class="row mt-2" v-if="isExpanded" data-e2e-type="history-item-info">
      <div class="col">
        <span>{{ createdAt | localDateTime('MM-DD-YYYY HH:mm') }}</span>
        <span class="ml-2">
          <status-icon :status="status"/>
        </span>
        <span class="ml-2" data-e2e-type="history-item-created-by">{{ createdBy }}</span>
        <span v-if="isHT" class="type type-ht ml-2">HT</span>
        <span v-else-if="isMT" class="type type-mt ml-2">MT</span>
      </div>
    </div>
  </div>
</template>

<script src="./segment-history-item.js"></script>
<style lang="scss" scoped src="./segment-history-item.scss"></style>