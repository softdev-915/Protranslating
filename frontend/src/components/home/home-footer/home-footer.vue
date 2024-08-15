<template>
  <footer>
    <span class="pull-left">
      Copyright {{utcYear}} BIG Language Solutions |
      <a
        data-e2e-type="footer-pp-link"
        rel="noopener noreferrer"
        href="https://biglanguage.com/privacy/"
        target="_blank">Legal</a>
    </span>
    <span
      data-e2e-type="app-version"
      class="pull-right"
      :class="{'mocked': mock}"
      @click="switchOffMock">{{appName}} {{appVersion}}
    </span>
  </footer>
</template>

<script src="./home-footer.js"></script>

<style scoped lang="scss" src="./home-footer.scss"></style>
