const mongoose = require('mongoose');

const { Schema } = mongoose;

/* message format */
const MessageSchema = new Schema({
  userId: String,
  message: String,
  timeStamp: { type: Date, default: Date.now }
});

const ChatSchema = new Schema({
  chatName: String,
  chatId: String,
  owner: String,
  members: [],  // member's usernames
  messages: [MessageSchema]
});

module.exports = mongoose.model('Chat', ChatSchema);
