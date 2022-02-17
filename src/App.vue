<script setup>
// This starter template is using Vue 3 <script setup> SFCs
// Check out https://v3.vuejs.org/api/sfc-script-setup.html#sfc-script-setup
import { ref } from 'vue'
import HelloWorld from './components/HelloWorld.vue'
import TestCom from './components/TestCom.vue'
import Test1 from './components/Test-1.vue'
import Test2 from './components/Test-2.vue'
import Test3 from './components/Test-3.vue'

const a = ref(1)
</script>

<template>
    <HelloWorld :msg="/* __i18n__ */`Vuzxxzze1222 哈啊啊啊2111231232哈哈哈xxx1`" />
    <TestCom />
    <Test1 />
    <Test2 />
    <Test3 />
    <div>z1xxxxxx</div>
    {{ /** __i18n__ */'xxxx1xxxxxxxxxzzzzzzxxxxzzzzzz我是你的重中之重下下下下' }}
    <div>{{ /** __i18n__ */'人总是很心情愉悦,ko, 无论是谁, 都无法阻止我' }}</div>
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
