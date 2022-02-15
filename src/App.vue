<script setup>
// This starter template is using Vue 3 <script setup> SFCs
// Check out https://v3.vuejs.org/api/sfc-script-setup.html#sfc-script-setup
import { ref } from 'vue'
import HelloWorld from './components/HelloWorld.vue'
import TestInfo from './components/TestInfo.vue'

const a = ref(1)
</script>

<template>
    <HelloWorld :msg="/* __i18n__ */`Vuzxxzze1222 哈啊啊啊22哈哈哈xxx`" />
    <TestInfo />
    <div>z1xxxxxx</div>
    {{ /** __i18n__ */'xxxx1xxxxxxxxxzzzzzzxxxxzzzzzz我是你的重中之重下下下下' }}
    <div>{{ /** __i18n__ */'我是一个十分有趣的人哈哈哈哈,我是你的爱人' }}</div>
</template>

<style>
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
  margin-top: 60px;
}
</style>
