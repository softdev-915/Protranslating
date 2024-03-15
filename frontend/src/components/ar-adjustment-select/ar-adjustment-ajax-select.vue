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

<script src="./ar-adjustment-ajax-select.js"></script>
