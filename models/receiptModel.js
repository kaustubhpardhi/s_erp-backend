const mongoose = require("mongoose");

const receiptSchema = new mongoose.Schema(
  {
    pawatiNumber: {
      type: Number,
      autoIncrement: true,
      sequence_value: 0,
      unique: true,
    },
    receiptDate: {
      type: String,
    },
    month: {
      type: String,
    },

    Name: {
      type: String,
    },
    email: {
      type: String,
    },
    mobileNumber: {
      type: Number,
    },
    address: {},
    purpose: {
      type: String,
    },
    amount: {
      type: Number,
    },
    modeOfPayment: {},
    gotra: {
      type: String,
    },
    poojaDate: {
      type: String,
    },
    uid: {
      type: String,
    },
    aadhar: {
      type: String,
    },
    // uidType: {
    //   type: String,
    // },
    section: {
      type: String,
    },
    // urn: {
    //   type: String,
    // },
    donationType: {
      type: String,
    },
    status: {
      type: String,
    },
    successfulTransactionNumber: {
      type: Number,
      default: 0,
    },

    // urnDate: {
    //   type: String,
    // },
  },
  { timestamps: true }
);

module.exports = mongoose.model("ReceiptNiraProduction", receiptSchema);
