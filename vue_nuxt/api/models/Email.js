import { Schema, model } from 'mongoose'

const EmailSchema = new Schema({
  id: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true
  }
})

export default model('Email', EmailSchema)
