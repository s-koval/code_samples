<template>
  <div class="container">
    <form id="email-form" @submit.prevent="handleSubmit">
      <label v-if="!url" for="email">
        Email
        <br>
        <input
          id="email"
          type="email"
          :value="email"
          placeholder="Enter your email address"
          @input="handleEmailChange"
        >
        <br>
        <span v-if="error" class="error">{{ error }}</span>
      </label>
      <br>
      <button v-if="!url" type="submit">
        Submit
      </button>
      <button v-else type="button" @click="handleCopyAction">
        {{ copyText }}
      </button>
    </form>
  </div>
</template>
<script>
import { makeid } from '@/utils/helpers'
export default {
  data () {
    return {
      email: '',
      randomId: '',
      error: undefined,
      url: undefined,
      copied: false
    }
  },
  computed: {
    copyText () {
      return this.copied ? 'Copied' : 'Copy URL'
    }
  },
  methods: {
    handleCopyAction () {
      this.$clipboard(this.url)
      this.copied = true
    },
    handleEmailChange (e) {
      this.email = e.target.value
    },
    async handleSubmit () {
      this.error = undefined
      try {
        const body = {
          email: this.email,
          id: makeid(10)
        }
        const { email } = await this.$http.$post('/api/emails', body)
        this.url = `${window.location.host}/app/${email.id}`
        this.email = ''
        this.randomId = ''
      } catch (e) {
        this.error = e.response && e.response.data ? e.response.data.message : 'Oops! Something went wrong'
      }
    }
  }
}
</script>

<style scoped lang="scss">
#email-form {
  margin: auto;
  max-width: 480px;
  justify-content: center;
  align-items: center;
  padding: 15px;
  display: flex;
  flex-direction: column;
  &>*{
    margin-top: 15px;
  }
}
.error {
  color: red;
  font-size: 10px;
}
</style>
