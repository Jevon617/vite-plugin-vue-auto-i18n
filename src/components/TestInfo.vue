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
    <p>{{ msg }}，{{ a }}, {{ b }}, <slot></slot></p>
</template>

<style scoped>
a {
  color: #42b983;
}
</style>
