<template>
  <input ref="email"
    v-on="wrappedListeners"
    aria-label="User email"
    :id="elemId"
    :autocomplete="autocomplete"
    :name="elemName"
    type="email"
    v-model="email"
    :placeholder="placeholder"
    :class="classes"
    :style="styles"
    @keyup="keyup"
    @keydown="keydown"
    @keypressed="keypressed">
</template>

<script src="./pts-email-input.js"></script>
