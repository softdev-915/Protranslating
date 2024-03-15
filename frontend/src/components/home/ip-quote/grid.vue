<template>
  <div class="dashboard">
    <h2 class="dashboard__header">What would you like to translate today?</h2>
    <div class="dashboard__body">
      <div class="card">
        <div class="card__image-holder">
          <img class="card__image" src="@/assets/images/big-ip_patent-translation.svg" />
          <div>
            <h5 class="card__title">Patent Translation</h5>
            <h5 class="card__title">Quote</h5>
          </div>
        </div>
        <div class="card-body">
          <div style="margin-top: 24px">
            <router-link
              class="database-button"
              tag="div"
              :to="{
                name: 'ip-quote-create',
                query: { translationOnly: true},
                params: {
                  service: 'Patent Translation Quote',
                  database: 'PCT National Phase',
                },
              }"
              data-e2e-type="pct-national-phase-translation-only-button">
              <span>PCT National Phase</span>
              <i class="fas fa-chevron-right"></i>
            </router-link>
            <router-link
            class="database-button mt-2"
            tag="div"
            :to="{
              name: 'ip-quote-epo-create',
              query: { translationOnly: true},
            }"
            data-e2e-type="epo-translation-only-button">
              <span>EP Validation / Claims in response to 71(3)</span>
              <i class="fas fa-chevron-right"></i>
            </router-link>
            <router-link
              class="database-button mt-2"
              tag="div"
              :to="{
                name: 'ip-quote-create-no-db',
                params: {
                  service: 'Patent Translation Quote',
                  database: 'Direct Filing / Paris Convention',
                },
              }"
              data-e2e-type="direct-translation-phase-button">
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
            <h5 class="card__title">Patent Translation </h5>
            <h5 class="card__title">and Filing Quote</h5>
          </div>
        </div>
        <div class="card-body">
          <div style="margin-top: 24px">
            <router-link
              class="database-button"
              tag="div"
              :to="{
                name: 'ip-quote-create',
                query: { translationOnly: false},
                params: {
                  service: 'Patent Translation and Filing Quote',
                  database: 'PCT National Phase',
                },
              }"
              data-e2e-type="pct-national-phase-filing-button">
              <span>PCT National Phase</span>
              <i class="fas fa-chevron-right"></i>
            </router-link>
            <router-link
              class="database-button mt-2"
              tag="div"
              :to="{name: 'ip-quote-epo-create'}"
              data-e2e-type="epo-translation-and-filling-button">
              <span>EP Validation</span>
              <i class="fas fa-chevron-right"></i>
            </router-link>
            <router-link
              class="database-button mt-2"
              tag="div"
              :to="{
                name: 'ip-quote-create-no-db-filing',
                params: {
                  service: 'Patent Translation and Filing Quote',
                  database: 'Direct Filing / Paris Convention',
                },
              }"
              data-e2e-type="direct-translation-and-filing-phase-button">
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
            <h5 class="card__title other">Standard & Legal</h5>
            <h5 class="card__title other">Translation</h5>
          </div>
        </div>
        <div class="card-body">
          <div
            :class="{ unclickable: !canCreateOther }"
            style="margin-top: 24px">
            <router-link
              class="database-button"
              :to="{
                name: 'create-quote',
                query: {
                  requireQuotationParam: true,
                  quoteDueDateParam: true,
                },
              }"
              tag="div"
              data-e2e-type="other-ip-button">
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
