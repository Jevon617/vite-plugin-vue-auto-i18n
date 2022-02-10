<script setup>
// This starter template is using Vue 3 <script setup> SFCs
// Check out https://v3.vuejs.org/api/sfc-script-setup.html#sfc-script-setup
import { ref } from 'vue'
import HelloWorld from './components/HelloWorld.vue'
import TestInfo from './components/TestInfo.vue'

const a = ref(1)
</script>

<template>
    <HelloWorld :msg="/* __i18n__ */`Vue1 哈哈哈哈`" />
    <TestInfo />
    <div>123123</div>
    {{ /** __i18n__ */'我是笨蛋啊啊' }}
    <div>{{ /** __i18n__ */'我是油桶啊,你是笨蛋啊' }}</div>
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
