<template>
  <section v-if="!!email" class="container">
    <h2>
      {{ email }}
    </h2>
  </section>
  <section v-else>
    <h2>Access Denied</h2>
  </section>
</template>

<script>
export default {
  asyncData ({ params, error, $http }) {
    return $http.$get(`/api/emails/${params.id}`)
      .then((res) => {
        if (res.success) {
          return {
            email: res.email.email
          }
        }
      })
      .catch(console.error)
  },
  data () {
    return {
      email: undefined
    }
  },
  head () {
    return {
      title: 'Email Viewer'
    }
  }
}
</script>

<style scoped lang="scss">
section {
  margin: 25px auto;
  display: flex;
  justify-content: center;
  align-items: center;
}
</style>
