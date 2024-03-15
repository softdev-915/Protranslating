<template>
  <div
    data-e2e-type="resources-search-result"
    class="portalcat-resources-search-result tm"
    ref="searchResult"
    @click="onClick">
    <template v-if="isMinimized">
      <div class="d-flex align-items-center">
        <div class="resource-info mr-3" v-if="isHt || isMt || matchScore">
          <div class="type" :class="{ ht: isHt, mt: isMt }">
            <span v-if="isHt || isMt" data-e2e-type="search-result-origin">{{ resourceType }}</span>
            <span v-if="!isMt && matchScore" data-e2e-type="search-result-match">{{ matchScore }}%</span>
          </div>
        </div>
        <div class="search-match">
          <p class="mb-0" data-e2e-type="search-result-target">{{ targetText }}</p>
        </div>
      </div>
    </template>
    <template v-else>
      <div class="search-match maximized mb-1">
        <div class="row">
          <div class="col">
            <p class="source" data-e2e-type="search-result-source">{{ sourceText }}</p>
            <p class="mb-0" data-e2e-type="search-result-target">{{ targetText }}</p>
          </div>
          <div class="col-auto">
            <a href="#" class="apply-resource-btn btn btn-link" @click="onApplyResourceClick" data-e2e-type="search-result-apply-btn">
              <i class="fas fa-angle-double-right"></i>
            </a>
          </div>
        </div>
      </div>
      <div class="resource-info">
        <div class="row">
          <div class="col-auto" v-if="isHt || isMt || matchScore">
            <div class="type" :class="{ ht: isHt, mt: isMt }">
              <span v-if="isHt || isMt" data-e2e-type="search-result-origin">{{ resourceType }}</span>
              <span v-if="!isMt && matchScore" data-e2e-type="search-result-match">{{ matchScore }}%</span>
            </div>
          </div>
          <div class="col" v-if="!isMt">
            <div class="info" data-e2e-type="search-result-info">
              <span>{{ customChangeId }}, {{ localChangeDate }},<span v-if="!isHt"> TM,</span> {{ tmName }}, {{ ownerCompanyName }}</span>
            </div>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<script src="./resources-search-result.js"></script>