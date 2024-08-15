<template>
  <basic-select
    v-bind="customProps"
    v-on="customListeners"
    :options="countryOptions"
    :selected-option="selectedCountry"
    @select="onCountrySelected">
  </basic-select>
</template>

<script src="./country-selector.js"></script>
