<template>
  <ip-select
    class='ip-contact-select'
    :options="options"
    item-key="name"
    v-model="selectedContact"
    :placeholder="placeholder"
    :data-e2e-type="dataE2eType"
    isRectangleStyle
  />
</template>

<script src='./ip-contact-select.js'> </script>