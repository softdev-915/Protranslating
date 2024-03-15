<template>
  <!-- <b-breadcrumb :items="items" @click="nav"></b-breadcrumb> -->
  <ol class="breadcrumb">
    <li
      class="breadcrumb-item"
      :class="{'active': item.active}"
      v-for="item in items"
      v-bind:key="item.name">
      <span v-if="item.active" v-html="item.text"></span>
      <a :href="item.href" @click="nav($event, item)" v-else> {{ item.text }}</a>
    </li>
  </ol>
</template>

<script src="./url-based-breadcrumb"></script>
