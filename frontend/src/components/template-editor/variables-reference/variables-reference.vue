<template>
  <div class="var-list">
    <div v-for="variable in varList" class="var mb-3">
      <template v-if="typeof vars[variable] === 'object'">
        <template v-if="vars[variable] instanceof Date">
          <variable-description :name="variable" :date="vars[variable]" :parent-path="parentPath"></variable-description>
        </template>
        <template v-else-if="Array.isArray(vars[variable])">
          <span><i class="pts-clickable fas fa-plus-square-o" aria-hidden="true" @click="setVisible(variable, true)" v-show="!visible[variable]"></i></span>
          <span><i class="pts-clickable fas fa-minus-square-o" aria-hidden="true" @click="setVisible(variable, false)" v-show="visible[variable]"></i></span>
          <variable-description :obj="true" :arr="vars[variable]" :name="variable" :parent-path="parentPath "></variable-description>
          <div class="p-2" v-show="visible[variable]">
            <variable-description :arr="vars[variable]" :name="variable" :parent-path="parentPath"></variable-description>
          </div>
        </template>
        <template v-else>
          <span><i class="pts-clickable fas fa-plus-square-o" aria-hidden="true" @click="setVisible(variable, true)" v-show="!visible[variable]"></i></span>
          <span><i class="pts-clickable fas fa-minus-square-o" aria-hidden="true" @click="setVisible(variable, false)" v-show="visible[variable]"></i></span>
          <span><variable-description :obj="true" :name="variable" :parent-path="parentPath"></variable-description></span>
          <div class="p-2" v-show="visible[variable]">
            <variables-reference :vars="vars[variable]" :name="variable" :parent-path="parentPath + variable + '.'"></variables-reference>
          </div>
        </template>
      </template>
      <template v-else-if="typeof vars[variable] === 'string'">
        <variable-description :name="variable" :str="vars[variable]" :parent-path="parentPath"></variable-description>
      </template>
      <template v-else-if="typeof vars[variable] === 'number'"><variable-description :name="variable" :num="vars[variable]" :parent-path="parentPath"></variable-description></template>
      <template v-else><variable-description :name="variable" :bool="vars[variable]" :parent-path="parentPath"></variable-description></template>
    </div>
  </div>
</template>

<script src="./variables-reference.js"></script>

<style scoped lang="scss" src="./variables-reference.scss"></style>
