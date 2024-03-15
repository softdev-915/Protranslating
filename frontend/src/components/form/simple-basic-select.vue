<template>
  <div :class="containerClass">
    <basic-select
      v-bind="wrappedProps"
      :selected-option="selectedOption"
      :options="formattedOptions"
      :mandatory="mandatory"
      :class="{ 'blur-loading-row' : isWaitingForOptions }"
      :isDisabled="disabled"
      v-on="wrappedListeners"
      @select="onSelect"/>
  </div>
</template>

<script src="./simple-basic-select.js"></script>
