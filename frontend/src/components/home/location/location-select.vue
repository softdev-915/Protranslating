<template>
  <basic-select
    v-bind="customProps"
    v-on="customListeners"
    :options="locationOptions"
    :selected-option="selectedOption"
    :class="{'blur-loading-row' : loading}"
    @select="onLocationSelect"
    @click.native="retrieveOptions">
  </basic-select>
</template>

<script src="./location-select.js"></script>
