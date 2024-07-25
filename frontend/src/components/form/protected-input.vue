<template>
  <div class="protected-input" v-if="canEdit">
    <input
      :type="isPasswordVisible ? 'text' : 'password'"
      :value="value"
      @input="$emit('input', $event.target.value)"
      class="form-control"
      :placeholder="placeholder"
      :name="name"
      v-validate="rules"
    >
    <i
      class="pts-clickable fas show-value"
      :class="{'fa-eye': !isPasswordVisible, 'fa-eye-slash': isPasswordVisible}"
      aria-hidden="true"
      @click="isPasswordVisible = !isPasswordVisible"
    >
    </i>
  </div>
  <span class="readonly" v-else>
    <span v-if="!isPasswordVisible">•••••••••••</span>
    <span v-else>{{ value }}</span>
    <i
      v-if="canRead"
      class="pts-clickable fas show-value"
      :class="{'fa-eye': !isPasswordVisible, 'fa-eye-slash': isPasswordVisible}"
      aria-hidden="true" @click="isPasswordVisible = !isPasswordVisible"
    >
    </i>
  </span>
</template>

<script src="./protected-input.js"></script>
<style lang="scss" scoped>
  .protected-input {
    position: relative;
  }

  .show-value {
    position: absolute;
    right: 20px;
    top: 50%;
    transform: translateY(-50%);
  }
</style>
