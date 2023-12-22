<template>
    <ul class="addressee-list ww-box" v-prevent-parent-scroll>
        <transition-group mode="in-out" name="addressee" tag="div">
            <addressee-list-item
                    v-for="(user, index) in users"
                    :index="index"
                    :key="user._id"
                    :itemClickFunc="itemClickFunc"
                    :user="user"
                    class="addressee-list-item">
            </addressee-list-item>
        </transition-group>
    </ul>
</template>

<script>
    //IMPORTED COMPONENTS
    import AddresseeListItem from './AddresseeListItem.vue';

    export default {
        name: 'AddresseeList',
        props: ['users', 'itemClickFunc'],
        components: {
            AddresseeListItem
        }
    }
</script>

<style scoped lang="scss">
    .addressee-list {
        padding: 0;

        min-height: 150px;
        max-height: 150px;

        overflow: scroll;
        overflow-x: hidden;
    }

    .addressee-enter {
        opacity: 0;
    }

    .addressee-enter-active {
        animation: addressee-in .5s ease-out forwards;
        transition: opacity .5s;
    }

    .addressee-leave-active {
        animation: addressee-out .5s ease-out forwards;
        transition: opacity 1s;
        opacity: 0;
        position: absolute;
    }

    .addressee-list-item.addressee-leave-active:hover {
        background: rgba(255, 255, 255, 1);
    }

    .addressee-move {
        transition: transform 1s;
    }

    @keyframes addressee-in {
        from {
            transform: translateY(20px)
        }
        to {
            transform: translateY(0);
        }
    }

    @keyframes addressee-out {
        from {
            transform: translateY(0)
        }
        to {
            transform: translateY(20px);
        }
    }
</style>