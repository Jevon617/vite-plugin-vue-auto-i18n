<script>
import { ref, computed, defineComponent } from 'vue'
import { useI18n } from 'vue-i18n'
export default defineComponent({
  props: {
    msg: String,
    a: Number,
    b: Number
  },
  setup() {

    return {
    }
  }
})


</script>

<template>
    <div>z1xxxxxx</div>
    {{ /** __i18n__ */'xxxx1xxxxxxxxxzzzzzzxxxxzzzzzz我是你的重中之重下下下下' }}
    <div>{{ /** __i18n__ */'我是一个十分有趣的人哈哈哈哈,我是你的爱人' }}</div>
</template>

<style scoped>
a {
  color: #42b983;
}
</style>
