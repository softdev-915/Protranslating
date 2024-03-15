<template>
  <ajax-basic-select
    ref="abs"
    :filters="filter"
    :http-client="httpClient"
    :selected-option="selectedOption"
    :limit="limit"
    @select="onOptionSelect"
  />
</template>

<script src="./invoice-ajax-select.js"></script>
