import mongoose, { Schema } from 'mongoose';
import autoIncrement from 'mongoose-auto-increment';
import { User, Property } from '../models';
import sendNotifications from '../utils/notifications';


autoIncrement.initialize(mongoose.connection);

const messageTypes = {
    assistant: 'assistant',
    sellerResponse: 'sellerResponse',
    buyerResponse: 'buyerResponse',
    providerResponse: 'providerResponse',
};

const DealSchema = new Schema({

    buyer: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    seller: {
        type: Schema.Types.ObjectId,
        ref: 'User',
    },
    property: {
        type: Schema.Types.ObjectId,
        ref: 'Property',
    },
    providerRequests: [
        {
            requestId: {
                type: Schema.Types.ObjectId,
                ref: 'Request',
            },
            providerId: {
                type: Schema.Types.ObjectId,
                ref: 'User',
            },
            offer: {
                type: Number
            }

        }

    ],
    valuationInProgress: {
        type: Boolean,
        default: false
    },
    purchaseStatus: {
        type: String
    },
    provisionalOffer: {
        type: Number
    },
    valuerOffer: {
        type: Number,
    },
    buyerOffer: {
        type: Number,
    },
    sellerOffer: {
        type: Number,
    },
    finalOffer: {
        type: Number,
    },
    respondingKey: {
        key: {
            type: String
        },
        expiredAt: {
            type: Date
        }
    },
    isDealPropertyListed: {
        type: Boolean,
        default: true

    },
    dealStatus: {
        status: {
            type: String
        },
        displayStatus: {
            type: String
        },
        expiredAt: {
            type: Date
        },
        repeatStatus: {
            type: Boolean,
            default: false
        }
    },
    showMessagesSettings: {
        seller: {
            showValuationQuestion: {
                type: Boolean,
                default: false
            },
            showValuationButton: {
                type: Boolean,
                default: false
            },
            valuationQuestionTouched: {
                type: Boolean,
                default: false
            },
            showSolicitorQuestion: {
                type: Boolean,
                default: false
            },
            showSolicitorButton: {
                type: Boolean,
                default: false
            },
            solicitorQuestionTouched: {
                type: Boolean,
                default: false
            },
        },
        buyer: {
            showSolicitorQuestion: {
                type: Boolean,
                default: false
            },
            showSolicitorButton: {
                type: Boolean,
                default: false
            },
            solicitorQuestionTouched: {
                type: Boolean,
                default: false
            },

            showSurveyorQuestion: {
                type: Boolean,
                default: false
            },
            showSurveyorButton: {
                type: Boolean,
                default: false
            },
            surveyorQuestionTouched: {
                type: Boolean,
                default: false
            },
        },
        showDealCompletedMessage: {
            type: Boolean,
            default: false
        }
    },
    showContactDetailsSettings: {

        showSellerDetails: {
            type: Boolean,
            default: false
        },
        showBuyerDetails: {
            type: Boolean,
            default: false
        }

    },
    showDetailsSettings: {

        sellerSettings: {

            showBuyerDetails: {
                type: Boolean,
                default: false
            }
        },

        buyerSettings: {
            showSellerDetails: {
                type: Boolean,
                default: false
            },
        }
    },
    cancelReasons: {
        sellerReasons: {
            type: String
        },
        buyerReasons: {
            type: String
        }
    },
    dialog: [
        {
            message: {
                type: Array
            },
            from: {
                type: Schema.Types.ObjectId,
                ref: 'User',
            },
            to: {
                type: Schema.Types.ObjectId,
                ref: 'User',
            },
            messageType: {
                type: String,
                enum: Object.values(messageTypes)
            },
            additionalInfo: {},
            createdAt: {
                type: Date,
            },
            currentStatus: {
                status: {
                    type: String
                },
                expiredAt: {
                    type: Date
                }
            },
            isRead: {
                type: Boolean,
                default: false
            }
        }
    ]
}, {
    timestamps: true,
    toJSON: {
        transform: (doc, ret) => {
            delete ret.__v;
        }
    },
    toObject: {
        transform: (doc, ret) => {
        }
    }
});

class DealClass {

}

DealSchema.loadClass(DealClass);
DealSchema.plugin(autoIncrement.plugin, { model: 'Deal', field: 'displayId', startAt: 100 });

DealSchema.pre('save', async function (next) {
    if (this.isModified('dealStatus.status')) {
        const property = await Property.findById(this.property);
        const seller = await User.findById(this.seller);
        const buyer = await User.findById(this.buyer);

        await buyer.sendDealStatusUpdatedEmail(property, this);
        if (seller){
            await seller.sendDealStatusUpdatedEmail(property, this);
        }

    }
    next();

});
DealSchema.post('save', async function (deal, next) {

    if (deal.dealStatus.status) {

        const seller = await User.findById(deal.seller);
        const buyer = await User.findById(deal.buyer);

        let userIds;

        if (seller) {
            userIds = [seller.id, buyer.id];
        } else {
            userIds = [buyer.id];
        }

        sendNotifications.sendToUsers(userIds, 'dealUpdate', { dealId: deal.id });

    }
    next();
});
const Deal = mongoose.model('Deal', DealSchema);

export default Deal;
