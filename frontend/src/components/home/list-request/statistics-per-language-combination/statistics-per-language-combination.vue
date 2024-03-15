<template>
  <div
    :data-e2e-type="languageCombination.toLowerCase()"
    class="row p-3">
    <div class="col-12 col-md-3 pts-font-bold">
      <div>Language Combination</div>
      <div
        class="language-combination-checkbox"
        data-e2e-type="language-combination">
        <input
          :id="languageCombination"
          type="checkbox"
          class="pts-clickable"
          :checked="isSelected"
          @click="$emit('on-select', languageCombination)">
        <label class="pts-clickable" :for="languageCombination">
          {{ languageCombination }}
        </label>
      </div>
      <div v-if="isExpanded" class="providers">
        <button
          v-for="({userId, userName}, index) in providers"
          :key="`${userId}_${index}`"
          data-e2e-type="provider"
          @click="selectProvider(`${userId}_${index}`)"
          :class="{ 'btn-primary' : selectedProvider === `${userId}_${index}`}"
          class="btn">{{ userName }}</button>
      </div>
    </div>
    <div class="col-12 col-md-9">
      <div
        data-e2e-type="toggle-table-view"
        class="pts-clickable pts-no-text-select"
        :class="isExpanded ? 'expanded' : 'collapsed'"
        @click="$emit('on-toggle-view', languageCombination)">
        <strong>Expand/Collapse</strong>
        <i class="fas" :class="isExpanded ? 'fa-compress' : 'fa-expand'"></i>
      </div>
      <div class="statistics-container" v-if="isExpanded">
        <statistics-table
          v-for="(item, index) in selectedStatisticsByProvider.statistics"
          :key="`${item.fileName}-${languageCombination}`"
          :data-e2e-index="index"
          :data="item"/>
      </div>
    </div>
  </div>
</template>

<script src="./statistics-per-language-combination.js"></script>
<style lang="scss" scoped src="./statistics-per-language-combination.scss"></style>
