<template>
  <ip-card-section class="instant-quote-container">
    <h4
      v-if="isClaimsGrantedCountries"
      class="body__header"
      data-e2e-type="instant-quote-claims-header"
    >Translation Estimate for 71(3) Claims</h4>
    <table
      v-if="isClaimsGrantedCountries"
      :class="{
        'instant-quote-table': !translationOnly,
        'instant-quote-table-translation-only': translationOnly
      }"
      style="margin-top: 24px"
      data-e2e-type="claims-instant-quote-table"
    >
      <thead>
        <tr>
          <th>LANGUAGE</th>
          <th>TRANSLATION FEE</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="(fee, index) in claimsTranslationFeesSorted" :key="index">
          <td>{{ fee.language }}</td>
          <td :data-e2e-type="translationFeeE2eType(fee)">
            {{ quoteCurrency.symbol }} {{ formatFee(fee.calculatedFee[quoteCurrency.isoCode]) }}
          </td>
        </tr>
      </tbody>
    </table>
    <h4
      v-if="!isPatentTranslationFeesEmpty && isClaimsGrantedCountries && translationOnly"
      class="body__header mt-4"
      data-e2e-type="instant-quote-header"
    >Translation Estimate for {{ epo.patentPublicationNumber }}</h4>
    <h4
      v-else-if="!isPatentTranslationFeesEmpty"
      class="body__header mt-4"
      data-e2e-type="instant-quote-header"
    > {{ finalTitle }}
    </h4>
    <table
      v-if="!isPatentTranslationFeesEmpty"
      :class="{
        'instant-quote-table': !translationOnly,
        'instant-quote-table-translation-only': translationOnly
      }"
      style="margin-top: 24px"
      data-e2e-type="instant-quote-table"
    >
      <thead>
        <tr>
          <th>COUNTRY</th>
          <th v-if="!translationOnly">AGENCY FEE</th>
          <th v-if="!translationOnly">OFFICIAL FEE </th>
          <th>TRANSLATION FEE</th>
          <th v-if="!translationOnly">TOTAL</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="(fee, index) in translationFeeSorted" :key="index">
          <td>{{ fee.country }}</td>
          <td v-if="!translationOnly" :data-e2e-type="`${fee.country}-agency-fee`"> 
            <span class="currency-symbol">{{ quoteCurrency.symbol }}</span> {{ formatFee( fee.agencyFeeFixed[quoteCurrency.isoCode]) }}
          </td>
          <td v-if="!translationOnly" :data-e2e-type="`${fee.country}-official-fee`">
            <span class="currency-symbol">{{ quoteCurrency.symbol }}</span> {{ formatFee( fee.officialFee[quoteCurrency.isoCode]) }} 
          </td>
          <td :data-e2e-type="translationFeeE2eType(fee)">
            <span class="currency-symbol">{{ quoteCurrency.symbol }}</span> {{ formatFee( fee.calculatedFee[quoteCurrency.isoCode]) }}
          </td>
          <td v-if="!translationOnly" :data-e2e-type="`${fee.country}-total-fee`">
            <span class="currency-symbol">{{ quoteCurrency.symbol }}</span> {{formatFee(feeTotal(fee))}} 
          </td>
        </tr>
        <tr v-if="showAnnuityPaymentRow">
          <td>{{ annuityPaymentRow.name }}</td>
          <td colspan="4">
            <span class="custom">{{ annuityPaymentRow.message }}</span>
          </td>
        </tr>
      </tbody>
    </table>
    <div class="body__price">
      <ip-select
        :is-disabled="!isNew"
        class="currency-switcher"
        data-e2e-type="currency-select"
        v-if="currencySelected.isoCode"
        :options="currencies"
        item-key="isoCode"
        v-model="currencySelected"
      />
      <div class="price__total">
        <span>TOTAL: </span>
        <span data-e2e-type="quote-total">{{
          `${quoteCurrency.isoCode} ${formatFee(totalFee)}`
        }}</span>
      </div>
    </div>
    <div class="body__bullets mt-4" data-e2e-type="disclaimers">
      <p v-for="disclaimer in disclaimers" :key="disclaimer.id">
        {{ `• ${disclaimer.disclaimer}` }}
      </p>
      <p v-if="!isB1Available">
          •  As B1 is not available these values are being calculated from {{epo.kind}}
      </p>
    </div>
    <div class="pdf-container" v-html="epoTemplate"/>
  </ip-card-section>
</template>

<script src="./instant-quote.js"> </script>
<style scoped lang="scss" src="./instant-quote.scss"></style>
<style lang="scss" src="../pdf-shared.scss"></style>
<style lang="scss">
  .epo-pdf-content table{
    width: 100%;
  }
  .epo-pdf-content td{
    width: auto !important;
  }
</style>