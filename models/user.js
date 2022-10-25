const mongoose = require("mongoose");
const { userTypeList } = require("../constants/constants");

const userSchema = new mongoose.Schema({
  collections: {
    type: Array,
  },
  website: {
    type: String,
  },
  artist_category: {
    type: String,
  },
  type: {
    type: String,
    enum: userTypeList,
    default: userTypeList.buyer,
    required: true,
  },
  wallet_addresses: {
    type: Array,
  },
  email: {
    type: String,
  },
  name: {
    type: String,
  },
  pic_id: {
    type: String,
  },
  password: {
    type: String,
  },
  custodialAddress: {
    type: String,
  },
  custodialPrivateKey: {
    type: String,
  },
  deuro_balance: {
    type: String,
  },
});

const user = mongoose.model("User", userSchema);

module.exports = user;
