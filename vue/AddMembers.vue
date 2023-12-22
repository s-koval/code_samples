<template>
    <div>
        <div class="row">
            <div class="col-lg-6 list">
                <h6 class="ml-2 mb-3">Users:</h6>
                <addressee-list class="addressee-list"
                                :itemClickFunc="addInviteReceiver"
                                :users="users">
                </addressee-list>
                <p class="ml-2">Click on an item to add user in opposite list</p>
            </div>

            <transition name="invited-slide" mode="out-in">
                <div v-if="!showSuccess"
                     class="col-lg-6 list"
                     key="1">
                    <h6 class="ml-2 mb-3">These users will receive an invite to your chat:</h6>
                    <addressee-list class="addressee-list"
                                    :itemClickFunc="deleteInviteReceiver"
                                    :users="inviteReceivers">
                    </addressee-list>
                    <p class="ml-2">Click on an item removes it from list</p>
                </div>

                <div v-if="showSuccess"
                     class="col-lg-6 text-center success-sign"
                     key="2">
                    <h6 class="bg-success">The users successfully invited!</h6>
                </div>
            </transition>

            <div class="col-lg-12 text-right">
                <button class="btn btn-outline-info mr-2" @click="sendNotificationsWrapper">
                    Send invites
                </button>
            </div>
        </div>
    </div>
</template>

<script>
    //IMPORTED MAPPERS
    import {mapActions, mapGetters, mapMutations} from 'vuex';

    export default {
        name: 'AddMembers',
        props: {
            members: {
                type: Array,
                default() {
                    return []
                }
            }
        },
        data() {
            return {
                showSuccess: false
            }
        },
        computed: {
            ...mapGetters({
                appState: 'APP_G_GET_APP_STATE',
                chat: 'CHAT_SETTINGS_G_GET_CHAT',
                inviteReceivers: 'CHAT_SETTINGS_G_INVITE_RECEIVERS',
                users: 'CHAT_SETTINGS_G_GET_USERS'
            }),
        },
        watch: {
            chat(newChat) {
                if (newChat._id) {
                    this.getUsers();
                }
            }
        },
        methods: {
            ...mapActions({
                getUsers: 'CHAT_SETTINGS_A_FETCH_USERS',
                sendNotifications: 'CHAT_SETTINGS_A_SEND_NOTIFICATIONS'
            }),
            ...mapMutations({
                pushInviteReceivers: 'CHAT_SETTINGS_M_PUSH_INVITE_RECEIVERS',
                resetInviteReceivers: 'CHAT_SETTINGS_M_RESET_INVITE_RECEIVERS',
                spliceInviteReceivers: 'CHAT_SETTINGS_M_SPLICE_INVITE_RECEIVERS'
            }),
            addInviteReceiver(index) {
                this.pushInviteReceivers(this.users[index]);
            },
            deleteInviteReceiver(index) {
                this.spliceInviteReceivers(index);
            },
            sendNotificationsWrapper() {
                this.sendNotifications();
                this.showSuccess = true;
                setTimeout(() => {
                    this.showSuccess = false
                }, 2500);
            }
        },
        created() {
            if (this.appState && this.chat._id) {
                this.getUsers();
            }
        },
        beforeDestroy() {
            this.resetInviteReceivers();
        }
    }
</script>

<style lang="scss" scoped>
    $grey170: rgba(170, 170, 170, 1);

    .list {
        h6 {
            color: $grey170;
        }

        p {
            color: $grey170;
            font-size: 11px;
            cursor: pointer;
        }
    }

    .success-sign {

        color: rgba(255, 255, 255, 1);

        font-weight: 500;

        h6 {
            margin-top: 33px;
            padding: 66px 0 66px 0;
            border-radius: 4px;
        }
    }

    .addressee-list {
        margin: 0 5px 0 5px;
    }

    /*ANIMATIONS*/
    .invited-slide-enter {
        opacity: 0;
    }

    .invited-slide-enter-to {
        animation: invited-slide-in 250ms ease-out forwards;
        transition: opacity .5s;
        opacity: 1;
    }

    .invited-slide-leave {
        opacity: 0;
        transform: translateX(0);
    }

    .invited-slide-leave-to {
        transition: opacity .5s ease;
        opacity: 0;
        animation: invited-slide-out 250ms ease-out forwards;
    }

    @keyframes invited-slide-in {
        from {
            transform: translateX(60px);
        }
        to {
            transform: translateX(0);
        }
    }

    @keyframes invited-slide-out {
        from {
            transform: translateX(0);
        }
        to {
            transform: translateX(60px);
        }
    }
</style>