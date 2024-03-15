<template>
  <multi-select
    :options="internalDepartmentsOptions"
    :selected-options="selected"
    :class="{'blur-loading-row' : loading}"
    @select="onInternalDepartmentSelected"
    v-bind="wrappedProps"
    v-on="wrappedListeners">
  </multi-select>
</template>

<script src="./internal-department-multi-selector.js"></script>
