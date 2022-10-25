const {
  transactionStatusList,
  transactionTypeList,
} = require("../constants/constants");
const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const transactionSchema = new mongoose.Schema({
  status: {
    type: String,
    enum: transactionStatusList,
    default: transactionStatusList.pending,
    required: true,
  },
  type: {
    type: String,
    enum: transactionTypeList,
    default: transactionTypeList.cashin,
  },
  buyer: { type: Schema.Types.ObjectId, ref: "User" },
  price: { type: Number },
  metamask_address: { type: String },
  asset: { type: Object },
  updatedAt: { type: Date, default: new Date() },
});

const transaction = mongoose.model("Transaction", transactionSchema);

module.exports = transaction;
