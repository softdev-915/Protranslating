<template>
  <simple-basic-select
    v-model="selectedGateway"
    :class="{ 'blur-loading-row' : isLoading }"
    :options="options" 
    @click.native="retrieveOptions" 
    :format-option="formatOption"/>
</template>

<script src="./payment-gateway-select.js" />