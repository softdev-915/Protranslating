<template>
  <div>
    <server-pagination-grid
      grid-name="providerPoolingOfferGrid"
      title="Provider Pooling Offer"
      :query="query"
      :key-prop="keyProp"
      :service="ppoService"
      :can-create="false"
      @grid-edit="onEdit($event)">
    </server-pagination-grid>
  </div>
</template>

<script src="./ppo-grid.js"></script>
