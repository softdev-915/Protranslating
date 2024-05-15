<template>
  <div :class="containerClass">
    <multi-select
      :selected-options="selectedOption"
      :options="competenceLevelOptions"
      :class="{'blur-loading-row': loading}"
      @click.native="retrieveOptions"
      @select="onCompetenceLevelSelected"
      v-bind="wrappedProps"
      v-on="wrappedListeners">
    </multi-select>
  </div>
</template>

<script src="./competence-level-selector.js"></script>
