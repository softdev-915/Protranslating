<template>
  <basic-select
    :options="requestsOptions"
    :selected-option="value"
    @select="onRequestSelected">
  </basic-select>
</template>

<script src="./request-selector.js">
