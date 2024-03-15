<template>
  <ajax-basic-select
    :filters="filter"
    ref="abs"
    :http-client="httpClient"
    :selected-option="selectedOption"
    :limit="limit"
    @select="onOptionSelect"
  />
</template>

<script src="./bill-adjustment-ajax-select.js"></script>
