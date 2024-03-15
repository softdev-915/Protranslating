<template>
  <user-ajax-basic-select
    :retrieve="retrieveProviders"
    :custom-attr="deletedCustomAttr"
    v-bind="wrappedProps"
    v-on="wrappedListeners">
  </user-ajax-basic-select>
</template>

<script src="./provider-selector.js"></script>
