<template>
  <div class="dashboard">
    <h2 class="dashboard__header">What would you like to translate today?</h2>
    <div class="dashboard__body">
      <div class="card">
        <div class="card__image-holder">
          <img class="card__image" src="@/assets/images/big-ip_patent-translation.svg" />
          <div>
            <h5 class="card__title">Patent Translation</h5>
            <h5 class="card__title">Order</h5>
          </div>
        </div>
        <div class="card-body">
          <div style="margin-top: 24px;">
            <router-link
              class="database-button"
              tag="div"
              data-e2e-type="wipo-order-link"
              :to="{
                name: 'ip-order-wipo-create',
                query: { isOrder: true, translationOnly: true }
              }">
                <span>PCT National Phase</span>
                <i class="fas fa-chevron-right"></i>
            </router-link>
            <div class="mt-2">
              <router-link
              class="database-button"
              tag="div"
              data-e2e-type="epo-translation-only-button"
              :to="{ name: 'ip-order-epo-create', query: { translationOnly: true }}">
                <span>EP Validation / Claims in response to 71(3)</span>
                <i class="fas fa-chevron-right"></i>
              </router-link>
            </div>
            <router-link
              class="database-button mt-2"
              tag="div"
              data-e2e-type="nodb-order-link"
              :to="{
                name: 'ip-order-create-no-db',
                params: {
                  service: 'Patent Translation Order',
                  database: 'Direct Filing / Paris Convention',
                },
              }">
              <span>Direct Filing / Paris Convention</span>
              <i class="fas fa-chevron-right"></i>
            </router-link>
          </div>
        </div>
      </div>
      <div class="card ml-3">
        <div class="card__image-holder">
          <img class="card__image" src="@/assets/images/big-ip_patent-litigation.svg" />
          <div>
            <h5 class="card__title">Patent Translation</h5>
            <h5 class="card__title">and Filing Order</h5>
          </div>
        </div>
        <div class="card-body">
          <div style="margin-top:24px;">
            <router-link
              class="database-button"
              tag="div"
              data-e2e-type="wipo-order-filing-link"
              :to="{
                name: 'ip-order-wipo-create',
                query: { isOrder: true, translationOnly: false }
              }">
                <span>PCT National Phase</span>
                <i class="fas fa-chevron-right"></i>
            </router-link>
            <div class="mt-2">
               <router-link
                class="database-button"
                tag="div"
                data-e2e-type="epo-translation-and-filling-button"
                :to="{ name: 'ip-order-epo-create'}">
                <span>EP Validation</span>
                <i class="fas fa-chevron-right"></i>
              </router-link>
            </div>
            <router-link
              class="database-button mt-2"
              tag="div"
              data-e2e-type="nodb-order-filing-link"
              :to="{
                name: 'ip-order-create-no-db-filing',
                params: {
                  service: 'Patent Translation and Filing Order',
                  database: 'Direct Filing / Paris Convention',
                },
              }">
              <span>Direct Filing / Paris Convention</span>
              <i class="fas fa-chevron-right"></i>
            </router-link>
          </div>
        </div>
      </div>
      <div class="card ml-3">
        <div class="card__image-holder">
          <img class="card__image" src="@/assets/images/big-ip_standard-translation.svg" />
          <div>
            <h5 class="card__title">Standard & Legal</h5>
            <h5 class="card__title ">Translation</h5>
          </div>
        </div>
        <div class="card-body">
          <div style="margin-top:24px;">
            <router-link class="database-button" :to="{ name: 'create-request'}" tag="div">
              <span>Standard / Legal Translation</span>
              <i class="fas fa-chevron-right"></i>
            </router-link>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script src="./grid.js"></script>
<style scoped lang="scss" src="./dashboard.scss"></style>
