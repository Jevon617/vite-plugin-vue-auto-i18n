<script>
import { ref, computed, defineComponent } from 'vue'
import { useI18n } from 'vue-i18n'
const __script = defineComponent({
  props: {
    msg: String
  },
  setup() {
    const a = 1

    return {
      a
    }
  }
})

__script.render = function() {
  return 1
}

export default __script

</script>
