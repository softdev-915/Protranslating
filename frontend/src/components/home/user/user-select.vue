<template>
  <span>
    <multi-select v-if="multi"
      :class="{'blur-loading-row': loading}"
      :options="usersOptions"
      :selected-options="selected"
      :placeholder="placeholder"
      title="User list"
      @select="onUserSelected"></multi-select>
    <simple-basic-select
      v-else
      v-model="selected"
      :class="{'blur-loading-row': loading}"
      :options="users"
      :format-option="formatOption"
      :placeholder="placeholder"
      title="User list"/>
  </span>
</template>

<script src="./user-select.js"></script>
