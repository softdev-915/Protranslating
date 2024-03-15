<template>
  <div
    data-e2e-type="statistics-table"
    class="table-container"
  >
    <div class="ml-3 resources-info">
      <div>Scope</div>
      <div data-e2e-type="statistics-file-name">{{data.fileName}}</div>
      <div>Resources</div>
      <div>{{data.statistics.resources}}</div>
    </div>
    <table>
      <thead>
      <tr>
        <th v-for="item in headCols" :key="item">{{item}}</th>
      </tr>
      </thead>
      <tbody>
      <tr v-for="(row, index) in statistics" :key="index">
        <td v-for="(cell, index) in row" :key="index">{{roundNumber(cell)}}</td>
      </tr>
      </tbody>
    </table>
  </div>
</template>

<script src="./statistics-table.js"></script>
<style lang="scss" scoped src="./statistics-table.scss"></style>
