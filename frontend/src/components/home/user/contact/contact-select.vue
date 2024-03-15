<template>
  <basic-deleted-aware-select
    :selected-option="contactSelected"
    @click.native="retrieveOptions"
    @select="onContactSelected"
    :options="contactOptions"
    :loading="loadingContacts"
    title="Contact list"
    :disabled="isDisabled">
  </basic-deleted-aware-select>
</template>

<script src="./contact-select.js"></script>
