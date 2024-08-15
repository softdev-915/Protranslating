<template>
  <div data-e2e-type="request-statistics-body" :class="{'blur-loading-row': loading}">
      <statistics-tab
        v-if="request"
        v-for="tab in tabs" :key="tab.name"
        :tab="tab"
        :allTabs="tabs"
        :isActive="activeTab === tab.name"
        :request="request"
        @selectTab="onSelectTab"/>
  </div>
</template>

<script src="./request-files-statistics.js"></script>
