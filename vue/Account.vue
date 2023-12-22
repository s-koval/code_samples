<template>
    <div class="page-content-wrapper gradient-bg">
        <!-- START PAGE CONTENT -->
        <div class="content sm-gutter">
            <!-- START CONTAINER FLUID -->
            <div class="container-fluid p-l-25 p-r-25 p-t-0 p-b-25 sm-padding-10">
                <!-- START ROW -->
                <div class="row" style="margin-top:6%; border-radius:10px">
                    <div class="card social-card share  full-width p-t-20 m-b-10 no-border" data-social="item"
                         style="border-radius:10px">
                        <!-- START WIDGET widget_map_sales-->
                        <!-- START ITEM -->
                        <div class="row">
                            <div class="col-lg-6 col-sm-12  d-flex flex-column">
                                <div class="card-description">

                                    <div class="bg-success text-white p-l-20 p-t-10 p-b-10 gradient-header">
                                        <font-awesome-icon icon="caret-down"/>
                                        <span class="p-l-5">Account - Basic Information</span>
                                    </div>
                                    <form id="form-account" class="p-t-15" role="form" method="post"
                                          v-on:submit.prevent="updateAccount">
                                        <!-- START Form Control-->
                                        <div class="form-group form-group-default">
                                            <label>Name</label>
                                            <div class="controls">
                                                <input type="text" name="name" v-validate="'required'" v-model="name"
                                                       placeholder="Your name" class="form-control" required>
                                                <span v-show="errors.has('name')" class="error">{{ errors.first('name') }}</span>
                                            </div>
                                        </div>
                                        <div class="form-group form-group-default">
                                            <label>Email</label>
                                            <div class="controls">
                                                <input type="email" name="email" v-validate="'required|email'"
                                                       v-model="email" placeholder="Email" class="form-control"
                                                       required>
                                                <span v-show="errors.has('email')" class="error">{{ errors.first('email') }}</span>
                                            </div>
                                        </div>
                                        <!-- END Form Control-->
                                        <button class="btn btn-primary btn-cons m-t-10" type="submit">Update</button>
                                    </form>
                                    <div v-if="isCompany">
                                        <hr>
                                        <div class="bg-success text-white p-l-20 p-t-10 m-t-10 p-b-10 gradient-header">
                                            <font-awesome-icon icon="caret-down"/>
                                            <span class="p-l-5">Shared Accounts</span>
                                        </div>
                                        <form id="form-add-shared" class="p-t-15" role="form" method="post"
                                              v-on:submit.prevent="createSharedAccount">
                                            <!-- START Form Control-->
                                            <div class="input-group">
                                                <input type="text" class="form-control" v-model="sharedAccountEmail"
                                                       placeholder="Email">
                                                <button type="submit"
                                                        class="btn btn-primary btn-xs input-group-addon primary"
                                                        name="sharedEmail">Add
                                                </button>
                                            </div>
                                        </form>
                                        <table class="table">
                                            <tr v-for="(account, index) in accounts" :key="'account-' + index">
                                                <td>{{account.email}}</td>
                                                <td>
                                                    <span v-if="account.accountId"
                                                          class="badge badge-primary">Active</span>
                                                    <span v-else class="badge badge-info">Pending</span>
                                                </td>
                                                <td class="text-center">
                                                    <a href="#" @click.prevent="removeSharedAccount(account.id)"
                                                       class="btn btn-danger btn-xs" title="Revoke Access">
                                                        <font-awesome-icon icon="trash"/>
                                                    </a>
                                                    <a href="#" @click.prevent="resendInvite(account.email)"
                                                       class="btn btn-primary btn-xs" title="Resend Invite">Resend
                                                        Invite</a>
                                                </td>
                                            </tr>
                                        </table>
                                    </div>

                                    <div v-if="!$store.state.user.socialId">
                                        <hr>
                                        <div class="bg-success text-white p-l-20 p-t-10 p-b-10 gradient-header">
                                            <font-awesome-icon icon="caret-down"/>
                                            <span class="p-l-5">Account - Change password</span>
                                        </div>
                                        <form id="form-password" class="p-t-15" role="form" method="post"
                                              v-on:submit.prevent="updatePassword">
                                            <!-- START Form Control-->
                                            <div class="form-group form-group-default">
                                                <label>Current Password</label>
                                                <div class="controls">
                                                    <input type="password" name="password" v-validate="'required'"
                                                           v-model="user.password" placeholder="Current password"
                                                           class="form-control" required>
                                                    <span v-show="errors.has('password')" class="error">{{ errors.first('password') }}</span>
                                                </div>
                                            </div>
                                            <div class="form-group form-group-default">
                                                <label>New Password</label>
                                                <div class="controls">
                                                    <input type="password" name="newPassword" v-validate="'required'"
                                                           v-model="user.newPassword" placeholder="New password"
                                                           class="form-control" required>
                                                    <span v-show="errors.has('newPassword')" class="error">{{ errors.first('newPassword') }}</span>
                                                </div>
                                            </div>
                                            <!-- END Form Control-->
                                            <button class="btn btn-primary btn-cons m-t-10" type="submit">Update
                                            </button>
                                        </form>
                                    </div>
                                    <hr>
                                    <div class="text-center">
                                        <button type="button" class="btn btn-link text-muted" @click="unsubscribePopup">
                                            Unsubscribe current plan
                                        </button>
                                    </div>
                                </div>
                            </div>

                            <div class="col-lg-6 col-sm-12 d-flex flex-column">
                                <div class="card-description m-l-20 m-r-20">
                                    <div class="bg-success text-white p-l-20 p-t-10 p-b-10 gradient-header">
                                        <font-awesome-icon icon="caret-down"/>
                                        <span class="p-l-5">Change Plan!</span>
                                    </div>
                                    <div class="mt-3 row mb-3 ml-2 mr-2">
                                        <select class="form-control" v-model="selectedPlan">
                                            <option :value="plans[plan].id" v-for="plan in Object.keys(plans)">
                                                {{plans[plan].name}} ${{plans[plan].cost}}
                                            </option>
                                        </select>
                                        <button type="button" class="btn btn-primary btn-cons m-t-10"
                                                :disabled="selectedPlan === currentPlan"
                                                @click="subscribe(selectedPlan)">
                                            Subscribe
                                        </button>
                                        <a href="https://www.triggr.ai/pricing" target="_blank"
                                           class="btn btn-link btn-cons m-t-10">Pricing</a>
                                    </div>
                                    <hr>
                                    <div class="bg-success text-white  p-l-20 p-t-10 p-b-10 gradient-header">
                                        <font-awesome-icon icon="caret-down"/>
                                        <span class="p-l-5">Buy Add-on credits!</span>
                                    </div>
                                    <credits-component redirect="Account"></credits-component>
                                </div>
                            </div>
                        </div>


                    </div>

                </div>
                <!-- END ROW -->
            </div>
            <!-- END CONTAINER FLUID -->
        </div>
        <!-- END PAGE CONTENT -->
    </div>


</template>

<script>
    import {HTTP} from '../services/http'
    import creditsComponent from ',,/components/Partials/Credits'
    import {allPlans, planById} from '../utils/plans'

    export default {
        name: 'Account',
        components: {
            creditsComponent
        },
        data() {
            return {
                user: {
                    name: null,
                    email: null,
                    password: null,
                    newPassword: null
                },
                accounts: [],
                sharedAccountEmail: null,
                selectedPlan: null,
                plans: allPlans()
            }
        },
        created() {
            this.sharedAccounts();
            this.selectedPlan = this.$store.state.user.plan;
        },
        computed: {
            name: {
                set(val) {
                    this.user.name = val
                },
                get() {
                    return this.$store.state.user.name
                }
            },
            email: {
                set(val) {
                    this.user.email = val
                },
                get() {
                    return this.$store.state.user.email
                }
            },
            currentPlan() {
                this.selectedPlan = this.$store.state.user.plan
                return this.$store.state.user.plan
            },
            isCompany() {
                return this.$store.state.user.plan === this.plans.company.id
            }
        },
        methods: {
            subscribe(planId) {
                const accountId = HTTP.getCurrentUserId();
                const plan = planById(planId);

                if (this.currentPlan === plan.id) {
                    return
                }
                this.$popup(
                    this.$checkout({
                        amount: plan.cost * 100,
                        coupon: true,
                        label: 'Subscribe',
                        handler: (token, coupon) => {
                            HTTP.post('/api/Stripe/purchase', {
                                token: token.id,
                                type: 'plan',
                                accountId,
                                plan: plan.id,
                                coupon
                            })
                                .then(purchase => {
                                    if (purchase.statusCode) {
                                        return Promise.reject(purchase.message)
                                    }
                                    this.$notify({
                                        group: 'sitewide',
                                        type: 'success',
                                        text: 'Successfully subscribed to plan!'
                                    });
                                    this.$store.state.user.plan = purchase.plan;
                                })
                                .catch(error => {
                                    this.$notify({
                                        group: 'sitewide',
                                        type: 'error',
                                        text: error || 'Could not subscribe to this plan!'
                                    })
                                })
                        }
                    }))
            },
            updateAccount() {
                const accountId = HTTP.getCurrentUserId();

                HTTP.patch(`/api/Accounts/${accountId}`, {
                    name: this.user.name || this.name,
                    email: this.user.email || this.email
                })
                    .then(res => {
                        this.$notify({
                            group: 'sitewide',
                            type: 'success',
                            text: 'Account updated!'
                        });
                        this.$store.dispatch('getUserData');
                    })
                    .catch(() => {
                        this.$notify({
                            group: 'sitewide',
                            type: 'error',
                            text: 'Error occurred while updating your account details'
                        })
                    })
            },
            updatePassword() {
                const accountId = HTTP.getCurrentUserId();

                HTTP.post(`/api/Accounts/${accountId}/updatePassword`, {
                    oldPassword: this.user.password,
                    newPassword: this.user.newPassword
                })
                    .then(() => {
                        this.$notify({
                            group: 'sitewide',
                            type: 'success',
                            text: 'Password updated!'
                        })
                    })
                    .catch(() => {
                        this.$notify({
                            group: 'sitewide',
                            type: 'error',
                            text: 'Error occurred while updating your account details'
                        })
                    })
            },
            unsubscribe() {
                HTTP.post('/api/Stripe/unsubscribe')
                    .then(() => {
                        this.currentPlan = null;
                        this.$notify({
                            group: 'sitewide',
                            type: 'success',
                            text: 'You have unsubscribed successfully'
                        });
                        this.$store.dispatch('getUserData');
                    })
            },
            unsubscribePopup() {
                this.$popup({
                    content: '<p>Are you sure you want to cancel your subscription?</p>',
                    confirmBtnAction: this.unsubscribe
                })
            },
            sharedAccounts() {
                HTTP.get('/api/SharedAccounts/accounts')
                    .then(accounts => {
                        this.accounts = accounts
                    })
            },
            removeSharedAccount(id) {
                HTTP.delete(`/api/SharedAccounts/${id}`)
                    .then(() => this.sharedAccounts())
            },
            createSharedAccount() {
                HTTP.post('/api/SharedAccounts/createAccount', {
                    email: this.sharedAccountEmail
                })
                    .then(() => {
                        this.sharedAccountEmail = null;
                        this.sharedAccounts();
                    })
            },
            resendInvite(email) {
                this.sharedAccountEmail = email;
                this.createSharedAccount();
            }
        }
    }
</script>

<style scoped>
    .price-box {
        margin: 0 auto;
        background: transparent !important;
        border-radius: 10px;
        width: 450px;
    }
</style>
