<script>
import { ref, defineComponent, getCurrentInstance } from 'vue'
import TestInfoVue from './TestInfo.vue'
export default defineComponent({
  components: {
    TestInfoVue
  },
  props: {
    msg: String
  },
  setup() {
    const test = ref(1)
    const name = /* __i18n__ */'我的天呐'
    const count = ref(/* __i18n__ */'见到你太高兴了')
    const placeholder = ref(/* __i18n__ */`你好,${name}, ${count.value}`)
    const ctx = getCurrentInstance()
    const changeLang = ()=> {
      // name.value = /* __i18n__ */'真难过啊'
      test.value = 2
      ctx.appContext.app.config.globalProperties.$changeLocale('jp')
    }
    //  createVNode(_component_TestInfoVue, { msg: _ctx.test }, null, 8, ["msg"])
    return {
      test,
      count,
      placeholder,
      changeLang
    }
  },
  mounted() {
    console.log('mounted', this)
  }
})


</script>

<template>
    <h1>{{ msg }}</h1>

    <p>
        Recommended IDE setup:
        <a href="https://code.visualstudio.com/" target="_blank">{{ 'VSCode' }}</a>
        +
        <a href="https://github.com/johnsoncodehk/volar" target="_blank">{{ ('i18n1') }}</a>
    </p>

    {{ /* __i18n__ */`Vue2也是一款好工具啊` }}

    <TestInfoVue :msg="/* __i18n__ */`Vue1 哈哈哈哈${test}`" b="2" :a="test" />


    <TestInfoVue :msg="/* __i18n__ */`Vue3 哈哈哈哈`" />

    <TestInfoVue :msg="/* __i18n__ */`Vue3 文档`">{{ {a: /* __i18n__ */`Vue1也是一款好工具啊`} }}</TestInfoVue>

    <TestInfoVue>{{ /* __i18n__ */`Vue0也是一款好工具啊` }}</TestInfoVue>

    <TestInfoVue><div>{{ /* __i18n__ */`Vue3真是一款好工具啊` }}</div></TestInfoVue>
    <a href="https://v3.vuejs.org/" target="_blank">{{ test + /* __i18n__ */'Vue3真是一款好工具啊' + test }}</a>

    <div>{{ /* __i18n__ */'我是一个可爱的人' }}</div>
    <p>
        Edit
        <code>{{ $t('i18n1') }}</code> to test hot module replacement.
    </p>
    <button type="button" @click="changeLang">count is: {{ /* __i18n__ */ test }}</button>
</template>

<style scoped>
a {
  color: #42b983;
}
</style>

