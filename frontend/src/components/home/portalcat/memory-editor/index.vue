<template>
  <memory-editor v-if="canEnter"/>
  <h1 v-else>You are not authorized to access Memory Editor</h1>
</template>

<script src="./index.js"></script>