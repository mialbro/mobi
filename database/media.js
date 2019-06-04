const mongoose = require("mongoose");
const Schema = mongoose.Schema;

MediaSchema = new Schema({
  src: String,
  contentType: String,
  name: String,
  message: String,
  owner: String, // objectId -> record label/manager/artist
  uploadDate: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Media", MediaSchema);
