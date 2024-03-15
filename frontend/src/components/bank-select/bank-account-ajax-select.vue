<template>
  <ajax-basic-select
    ref="abs"
    :http-client="httpClient"
    :selected-option="selectedOption"
    :limit="limit"
    @select="onOptionSelect"
  />
</template>

<script src="./bank-account-ajax-select.js"></script>
