<template>
  <simple-basic-select
    placehoder="Select Template"
    :options="options"
    :formatOption="optionFormatter"
    @input="onInput"
    @click.native="retrieveTemplates"
  />
</template>

<script src="./workflow-templates-select.js" />