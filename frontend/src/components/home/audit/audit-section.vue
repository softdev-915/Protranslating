<template>
  <div>
    <b-breadcrumb :items="items" @click="nav"></b-breadcrumb>
    <div
      class="sections"
      v-for="(section, index) in items"
      :key="index"
      v-show="section.active"
    >
      <div v-if="section.type == 'audit-grid'">
        <audit-grid :ref="index + ''"></audit-grid>
      </div>
    </div>
  </div>
</template>

<script src="./audit-section.js"></script>
