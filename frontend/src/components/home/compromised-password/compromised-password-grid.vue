<template>
  <server-pagination-grid
    ref="compromisedPasswordGrid"
    grid-name="compromisedPassword"
    title="Compromised Passwords"
    :key-prop="({ password }, i) => `${password}.${i}`"
    :service="service"
    :can-create="false"
  />
</template>

<script src="./compromised-password-grid.js"></script>
