<template>
  <div>
    <button @click.prevent="addExchange()" class="d-block fas fa-plus"/>
    <button v-if="!shouldDisableCurrency" @click.prevent="deleteExchange()" class="d-block fas fa-close"/>
  </div>
</template>

<script src="./currency-exchange-actions.js"></script>
