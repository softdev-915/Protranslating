<template>
  <span>
    <span v-if="type === 'object'">
      <span class="var-path">{{parentPath}}{{name}}</span>
      <span class="var-type">{{readableType}}</span>
    </span>
    <span v-else-if="type === 'simple'">
      <span class="var-path">{{parentPath}}{{name}}</span>
      <span class="var-type">{{readableType}}</span>
      <span class="var-value">{{value}}</span>
    </span>
    <span v-else>
      <span class="p-1">
        <variables-reference :parent-path="parentPath + name + '.'" :vars="arr[0]"></variables-reference>
      </span>
    </span>
  </span>
</template>

<script src="./variable-description.js"></script>

<style scoped lang="scss" src="./variable-description.scss"></style>
