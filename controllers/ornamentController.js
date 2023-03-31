const OrnamentReceipt = require("../models/ornamentModel");
const mongoose = require("mongoose");
const moment = require("moment");

const ornamentController = {
  checkReceipt: async (req, res) => {
    try {
      const checklastPawati = await OrnamentReceipt.find()
        .sort({ pawatiNumber: -1 })
        .limit(1);
      res.status(200).send(checklastPawati);
    } catch (error) {
      res.status(400).send({ error: error.message });
    }
  },

  createReceipt: async (req, res) => {
    try {
      const {
        pawatiNumber,
        receiptDate,
        Name,
        email,
        mobileNumber,
        address,
        gotra,
        uid,
        ornamentName,
        ornamentType,
        ornamentWeight,
        ornamentValue,
      } = req.body;
      const section = "Section 80G";
      const donationType = "";

      const checkExistence = await OrnamentReceipt.find({
        pawatiNumber: pawatiNumber,
      }).exec();
      if (checkExistence.length === 1) {
        return res
          .status(400)
          .send({ message: "pawati number already exists" });
      }

      const newOrnamentReceipt = new OrnamentReceipt({
        pawatiNumber: pawatiNumber,
        receiptDate: receiptDate,
        Name: Name,
        gotra: gotra,
        email: email,
        mobileNumber: mobileNumber,
        address: address,
        uid: uid,
        section: section,
        ornamentName: ornamentName,
        ornamentType: ornamentType,
        ornamentValue: ornamentValue,
        ornamentWeight: ornamentWeight,
      });
      await newOrnamentReceipt.save();
      res.status(200).send({ message: "Receipt Saved Successfully " });
    } catch (error) {
      console.log(error);
      res.status(500).send({ message: error.message });
    }
  },
};

module.exports = ornamentController;
