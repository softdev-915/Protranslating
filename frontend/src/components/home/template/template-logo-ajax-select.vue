<template>
  <ajax-basic-select
    title="Template Logo"
    :filter="filter"
    :http-client="httpClient"
    :selected-option="selectedOption"
    @select="onOptionSelect"
  />
</template>

<script src="./template-logo-ajax-select.js"></script>
