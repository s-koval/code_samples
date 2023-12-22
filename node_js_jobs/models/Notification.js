import mongoose, { Schema } from 'mongoose';
import sendNotifications from '../utils/notifications';

const NotificationSchema = new Schema({

    userId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    userAccountType: {
        type: String
    },
    type: {
        type: String
    },
    message: {
        body: {},
        data: {},
        from: {
            type: Schema.Types.ObjectId,
            ref: 'User',
        },
    },
    isRead: {
        type: Boolean,
        default: false
    },

}, {
    timestamps: true,
    toJSON: {
        transform: (doc, ret) => {
            delete ret.__v;
            delete ret.updatedAt;
        }
    },
    toObject: {
        transform: (doc, ret) => {
        }
    }
});

NotificationSchema.post('save', async function (notification, next) {
if (!notification.isRead) {
    sendNotifications.sendToUsers([notification.userId], 'newNotification', {});
}
    next();
});
const Notification = mongoose.model('Notification', NotificationSchema);

export default Notification;