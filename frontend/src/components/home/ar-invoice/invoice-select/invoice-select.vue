<template>
  <simple-basic-select
    :value="value"
    :disabled="disabled"
    :class="{'blur-loading-row' : isLoading}"
    :options="invoices"
    :format-option="formatOption"
    :fetch-on-created="fetchOnCreated"
    @select="onSelect"
    @delete="onDelete"
    @click.native="retrieveOptions"/>
</template>

<script src="./invoice-select.js" />