<template>
  <section-container title="Chart of Accounts">
    <accounts-section v-if="canRead" :can-create="canCreate" :can-edit="canEdit"/>
    <h4 v-else>You are not authorized to access this resource</h4>
  </section-container>
</template>
<script src="./index.js" />