const mongoose = require('mongoose');

const { Schema } = mongoose;

/* message format */
const MessageSchema = new Schema({
  email: String,
  username: String,
  message: String,
  timeStamp: { type: Date, default: Date.now }
});

const ChatSchema = new Schema({
  chatId: String,
  chatName: String, // chat's name
  ownerUsername: String,  // owner's username
  ownerEmail: String,     // owner's email
  members: [{email: String, username: String}],  // member's usernames
  messages: [MessageSchema]
});

module.exports = mongoose.model('Chat', ChatSchema);
