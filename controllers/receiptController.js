const Receipt = require("../models/receiptModel");
const mongoose = require("mongoose");
const excelJS = require("exceljs");
const secret =
  "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJlbmNyeXB0VGV4dCI6IjVhODgzNmRjLTUwMzgtNGVlNi05NjdkLTVmMjcxNzgzNGY4OSJ9.pXPtH0xCu5b3EDFAAYU_HIfOW9mgVvwE_QGmP4D7IkI";
const merchankKey = "vRu9Pnhkuu9l93waNd79uIYltDVDozmZ4/CrAf67Ud8=";
const merchankKeytwo = "2Q+5FpQVfZaM+b5XSuvpB8hW3dGAQkNhLSYNMgW1zAQ=";
const userIdSecret = "HiktfH0Mhdla4zDg0/4ASwFQh2OS+nf9MVL0ik3DsmE=";
var jwt = require("jsonwebtoken");
const { default: axios } = require("axios");
const CryptoJS = require("crypto-js");
const crypto = require("crypto");
const moment = require("moment");

const receiptController = {
  //Cheack Receipt Extistence

  checkReceipt: async (req, res) => {
    try {
      const checklastPawati = await Receipt.find()
        .sort({ pawatiNumber: -1 })
        .limit(1);
      res.status(200).send(checklastPawati);
    } catch (e) {
      res.status(400).send({ message: e.message });
    }
  },
  //Create Receipt

  createReceipt: async (req, res) => {
    try {
      const {
        pawatiNumber,
        receiptDate,
        Name,
        month,
        email,
        mobileNumber,
        address,
        purpose,
        amount,
        gotra,
        poojaDate,
        modeOfPayment,
        uid,
        uidType,
        aadhar,
      } = req.body;
      const section = "Section 80G";
      const urn = "AACTB6420HE20211";
      const urnDate = "06-04-2022";
      const donationType = "Specific Grant";
      let status = "";

      const checkExistence = await Receipt.find({
        pawatiNumber: pawatiNumber,
      }).exec();
      if (checkExistence.length === 1) {
        return res
          .status(400)
          .send({ message: "Pawati Number already exist!" });
      }

      let successfulTransactionNumber;
      if (modeOfPayment.mode === "Cheque" || modeOfPayment.mode === "Offline") {
        status = "success";
        const previousTransaction = await Receipt.find({ status: "success" })
          .sort({ successfulTransactionNumber: -1 })
          .limit(1);
        if (previousTransaction.length > 0) {
          successfulTransactionNumber =
            previousTransaction[0].successfulTransactionNumber + 1;
        } else {
          successfulTransactionNumber = 1;
        }
      }
      const newReceipt = new Receipt({
        pawatiNumber: pawatiNumber,
        receiptDate: receiptDate,
        Name: Name,
        month: month,
        gotra: gotra,
        poojaDate: poojaDate,
        email: email,
        mobileNumber: mobileNumber,
        address: address,
        purpose: purpose,
        amount: amount,
        modeOfPayment,
        uid: uid,
        // uidType: uidType,
        section: section,
        // urn: urn,
        // urnDate: urnDate,
        donationType: donationType,
        aadhar: aadhar,
        status,
        successfulTransactionNumber: successfulTransactionNumber,
      });
      await newReceipt.save();
      res.status(200).send({ message: "Receipt Saved Successfully" });
    } catch (err) {
      console.log(err);
      res.status(500).send({ message: err.message });
    }
  },

  //Get Package

  getReceipt: async (req, res) => {
    try {
      const { page, count } = req.body;
      const packages = await Receipt.find({
        $or: [
          { status: "success" },
          { "modeOfPayment.mode": "Offline" },
          { "modeOfPayment.mode": "Cheque" },
        ],
      })
        .skip((page - 1) * count)
        .limit(count)
        .sort({ createdAt: -1 })
        .exec();
      res.status(200).send({ packages });
    } catch (err) {
      console.log(err);
      res.status(400).send({ message: err.message });
    }
  },

  //Get Sum Amount

  getSumAmount: async (req, res) => {
    try {
      const totalSum = await Receipt.aggregate([
        { $match: { status: "success" } },
        { $group: { _id: null, sum_val: { $sum: "$amount" } } },
      ]);
      res.status(200).send({ Total_Amount: totalSum[0].sum_val });
    } catch (err) {
      res.status(400).send({ message: err.message });
    }
  },

  //Get Sum Amount

  getOnlineAmount: async (req, res) => {
    try {
      const totalSum = await Receipt.aggregate([
        { $match: { status: "success" } },
        { $group: { _id: null, sum_val: { $sum: "$modeOfPayment.Online" } } },
      ]);
      res.status(200).send({ Total_Amount: totalSum[0].sum_val });
    } catch (err) {
      res.status(400).send({ message: err.message });
    }
  },

  //Get DD Amount

  getDDAmount: async (req, res) => {
    try {
      const totalSum = await Receipt.aggregate([
        { $group: { _id: null, sum_val: { $sum: "$modeOfPayment.ChequeDD" } } },
      ]);
      res.status(200).send({ Total_Amount: totalSum[0].sum_val });
    } catch (err) {
      res.status(400).send({ message: err.message });
    }
  },

  //Get Sum Amount

  getCashAmount: async (req, res) => {
    try {
      const totalSum = await Receipt.aggregate([
        { $group: { _id: null, sum_val: { $sum: "$modeOfPayment.Cash" } } },
      ]);
      res.status(200).send({ Total_Amount: totalSum[0].sum_val });
    } catch (err) {
      res.status(400).send({ message: err.message });
    }
  },

  downloadExcel: async (req, res) => {
    try {
      await Receipt.find({}).then((data) => {
        res.json(data);
      });
    } catch (e) {
      res.status(400).send({ message: e.message });
    }
  },
  // Delete Package

  deletePackage: async (req, res) => {
    try {
      const { packageId } = req.body;
      const package = await Package.findByIdAndRemove({
        _id: packageId,
      }).exec();
      res.status(200).send({ message: package });
    } catch (err) {
      res.status(400).send({ message: err.message });
    }
  },

  //Get Package By Id

  getPackageById: async (req, res) => {
    try {
      const packageId = req.params.id;
      const package = await Package.find({ _id: packageId }).exec();
      res.status(200).send({ package });
    } catch (err) {
      res.status(400).send({ message: err.message });
    }
  },

  // Create Package Request

  createPackageRequest: async (req, res) => {
    try {
      const {
        status,
        packageId,
        startDate,
        endDate,
        numberOfPeople,
        location,
        userId,
      } = req.body;

      const newRequest = new Request({
        status: status,
        packageId: packageId,
        startDate: startDate,
        endDate: endDate,
        numberOfPeople: numberOfPeople,
        location: location,
        RequestedBy: userId,
      });
      await newRequest.save();
      res.status(200).send({
        message:
          "Your request is placed successfully we will connect you soon.",
      });
    } catch (err) {
      res.status(400).send({ message: err.message });
    }
  },

  //Update Package Request

  updatePackageRequest: async (req, res) => {
    try {
      const {
        status,
        packageId,
        startDate,
        endDate,
        numberOfPeople,
        resorts,
        roomType,
        mealPlan,
        transfers,
        inclusion,
        itinerary,
        price,
        flightDetails,
      } = req.body;
      const package = await Request.updateOne(
        { _id: mongoose.Types.ObjectId(packageId) },
        {
          status: status,
          startDate: startDate,
          endDate: endDate,
          numberOfPeople: numberOfPeople,
          resorts: resorts,
          roomType: roomType,
          mealPlan: mealPlan,
          transfers: transfers,
          inclusion: inclusion,
          itinerary: itinerary,
          price: price,
          flightDetails: flightDetails,
        }
      ).exec();
      res.status(200).send({ message: package });
    } catch (err) {
      res.status(400).send({ message: err.message });
    }
  },

  //Get Package Request for Admin

  getAllRequests: async (req, res) => {
    try {
      const requests = await Request.find({}).exec();
      res.status(200).send({ requests });
    } catch (err) {
      res.status(400).send({ message: err.message });
    }
  },

  // Get All request by userId

  getPackageRequestByUser: async (req, res) => {
    try {
      const { userId } = req.body;
      const requests = await Request.find({ RequestedBy: userId }).exec();
      res.status(200).send({ requests });
    } catch (err) {
      res.status(400).send({ message: err.message });
    }
  },

  //Delete Package Request By Id

  deletePackageRequest: async (req, res) => {
    try {
      const { packageRequestId } = req.body;
      const packageRequest = await Request.findByIdAndRemove({
        _id: mongoose.Types.ObjectId(packageRequestId),
      }).exec();
      res.status(200).send({ packageRequest });
    } catch (err) {
      res.status(400).send({ message: err.message });
    }
  },

  //Search Packages

  searchPackages: async (req, res) => {
    try {
      const { text } = req.body;
      const packages = await Package.find({
        $or: [
          {
            packageTitle: {
              $regex: text.localeCompare({ sensitivity: "accent" }),
            },
          },
        ],
      });
      res.status(200).send({ packages });
    } catch (e) {
      res.status(400).send({ message: e.message });
    }
  },

  //Create Order
  createOrder: async (req, res) => {
    try {
      const {
        fName,
        lName,
        orderId,
        mediaType,
        amount,
        product,
        expiryDate,
        country,
        currency,
        customerEmail,
        mobileNo,
        gotra,
        purpose,
        pawti,
        pan,
      } = req.body;
      console.log(req.body.expiryDate);
      const userId = "Sagar6781";

      const data = {};
      const orderbody = {};
      data["encryptText"] = JSON.stringify({
        userId: "Sagar6781",
        password: "Sagar@1234",
      });

      var encrypted = jwt.sign(data, secret, {
        algorithm: "HS256",
        noTimestamp: true,
      });
      var decryptedUser = jwt.verify(encrypted, secret);
      const loginRequest = await axios.post(
        `https://www.avantgardepayments.com/agadmin/api/signUpLogin/agId/paygate`,
        { loginRequest: encrypted }
      );
      console.log("Here is Login Response", loginRequest);
      const payload = loginRequest.data.payLoad;
      var decoded = jwt.verify(payload, secret, { algorithm: "HS256" });
      const decodeData = JSON.parse(decoded.encryptText);
      // console.log(decodeData);
      const userSessionKey = decodeData.sessionKey;
      // console.log(userSessionKey);
      const requestBody = {};
      requestBody["encryptText"] = JSON.stringify({
        firstName: fName,
        lastName: lName,
        mediaType: mediaType,
        orderId: orderId,
        amount: amount,
        product: product,
        expiryDate: expiryDate,
        country: country,
        currency: currency,
        customerEmail: customerEmail,
        mobileNo: mobileNo,
        status: "A",
        createdBy: "Kaustubh",
        successURL: `https://api.fitechs.in/transaction/success/admin/${fName}?amount=${amount}&pawti=${pawti}`,
        failureURL: `https://api.fitechs.in/transaction/failed/admin/${fName}?amount=${amount}&pawti=${pawti}`,
      });
      // console.log("Here is requestBody:", requestBody);
      var userEncryption = encode("Sagar6781", userIdSecret);

      var orderBody = encode(requestBody.encryptText, merchankKey);
      // console.log(orderBody);

      const createOrder = await axios.post(
        `https://www.avantgardepayments.com/agmerchant/sdk/mediaPaymentsv2/userId/Sagar6781`,
        { mediaBasedPostRequest: orderBody },
        {
          headers: {
            userId: userEncryption,
            sessionKey: userSessionKey,
          },
        }
      );
      // console.log("here is order response:", createOrder);

      console.log("here is order response:", createOrder);
      const response = decrypt(createOrder.data, merchankKey);
      // console.log("Here is your api response:", response);
      function encode(text, skey) {
        var base64Iv = "0123456789abcdef"; // generate your key
        var key = CryptoJS.enc.Base64.parse(skey);
        var iv = CryptoJS.enc.Utf8.parse(base64Iv);
        var encrypted = CryptoJS.AES.encrypt(text, key, {
          iv: iv,
          mode: CryptoJS.mode.CBC,
          padding: CryptoJS.pad.Pkcs7,
        });
        var decryptedData = encrypted.toString();
        return decryptedData;
      }

      function decrypt(text, skey) {
        var base64Iv = "0123456789abcdef";
        var key = CryptoJS.enc.Base64.parse(skey);
        var iv = CryptoJS.enc.Utf8.parse(base64Iv);
        var decrypted = CryptoJS.AES.decrypt(text, key, {
          iv: iv,
          mode: CryptoJS.mode.CBC,
          padding: CryptoJS.pad.Pkcs7,
        });
        var decryptedData = decrypted.toString(CryptoJS.enc.Utf8);
        return decryptedData;
      }

      // console.log("here is api res:", createOrder);
      res.status(200).send({ message: createOrder.data });
    } catch (err) {
      res.status(400).send({ message: err.message });
    }
  },
  payOut: async (req, res) => {
    try {
      const {
        fName,
        lName,
        orderId,
        mediaType,
        amount,
        product,
        expiryDate,
        country,
        currency,
        customerEmail,
        mobileNo,
        gotra,
        purpose,
        pawti,
        pan,
      } = req.body;
      // console.log(req.body.expiryDate);
      const userId = "Sagar6781";

      const data = {};
      const orderbody = {};
      data["encryptText"] = JSON.stringify({
        userId: "Sagar6781",
        password: "Sagar@1234",
      });

      var encrypted = jwt.sign(data, secret, {
        algorithm: "HS256",
        noTimestamp: true,
      });
      var decryptedUser = jwt.verify(encrypted, secret);
      const loginRequest = await axios.post(
        `https://www.avantgardepayments.com/agadmin/api/signUpLogin/agId/paygate`,
        // `https://pguat.safexpay.com/agadmin/api/signUpLogin/agId/paygate`,
        { loginRequest: encrypted }
      );
      console.log("Here is Login Response", loginRequest);
      const payload = loginRequest.data.payLoad;
      var decoded = jwt.verify(payload, secret, { algorithm: "HS256" });
      const decodeData = JSON.parse(decoded.encryptText);
      // console.log(decodeData);
      const userSessionKey = decodeData.sessionKey;
      // console.log(userSessionKey);
      const requestBody = {};
      requestBody["encryptText"] = JSON.stringify({
        firstName: fName,
        lastName: lName,
        mediaType: mediaType,
        orderId: orderId,
        amount: amount,
        product: product,
        expiryDate: expiryDate,
        country: country,
        currency: currency,
        customerEmail: customerEmail,
        mobileNo: mobileNo,
        status: "A",
        createdBy: "Kaustubh",
        // successURL: `https://api.fitechs.in/transaction/success/${fName}/${amount}/${customerEmail}/${mobileNo}/${pawti}/${pan}`,
        successURL: `https://api.fitechs.in/transaction/success/${fName}?amount=${amount}&pawti=${pawti}`,
        failureURL: `https://api.fitechs.in/transaction/failed/${fName}?amount=${amount}&pawti=${pawti}`,
      });
      // console.log("Here is requestBody:", requestBody);
      var userEncryption = encode("Sagar6781", userIdSecret);

      var orderBody = encode(requestBody.encryptText, merchankKey);
      // console.log(orderBody);

      const createOrder = await axios.post(
        `https://www.avantgardepayments.com/agmerchant/sdk/mediaPaymentsv2/userId/Sagar6781`,
        //`https://pguat.safexpay.com/agmerchant/sdk/mediaPaymentsv2/userId/Nike119`,
        { mediaBasedPostRequest: orderBody },
        {
          headers: {
            userId: userEncryption,
            sessionKey: userSessionKey,
          },
        }
      );
      // console.log("here is order response:", createOrder);

      // console.log("here is order response:", createOrder);
      const response = decrypt(createOrder.data, merchankKey);
      // console.log("Here is your api response:", response);
      function encode(text, skey) {
        var base64Iv = "0123456789abcdef"; // generate your key
        var key = CryptoJS.enc.Base64.parse(skey);
        var iv = CryptoJS.enc.Utf8.parse(base64Iv);
        var encrypted = CryptoJS.AES.encrypt(text, key, {
          iv: iv,
          mode: CryptoJS.mode.CBC,
          padding: CryptoJS.pad.Pkcs7,
        });
        var decryptedData = encrypted.toString();
        return decryptedData;
      }

      function decrypt(text, skey) {
        var base64Iv = "0123456789abcdef";
        var key = CryptoJS.enc.Base64.parse(skey);
        var iv = CryptoJS.enc.Utf8.parse(base64Iv);
        var decrypted = CryptoJS.AES.decrypt(text, key, {
          iv: iv,
          mode: CryptoJS.mode.CBC,
          padding: CryptoJS.pad.Pkcs7,
        });
        var decryptedData = decrypted.toString(CryptoJS.enc.Utf8);
        return decryptedData;
      }

      // console.log("here is api res:", createOrder);
      res.status(200).send({ message: createOrder.data });
    } catch (err) {
      res.status(400).send({ message: err.message });
    }
  },

  createOrderTwo: async (req, res) => {
    try {
      const {
        fName,
        lName,
        orderId,
        mediaType,
        amount,
        product,
        expiryDate,
        country,
        currency,
        customerEmail,
        mobileNo,
        gotra,
        purpose,
        pawti,
        pan,
      } = req.body;
      console.log(req.body.expiryDate);
      const userId = "Sagar1502";

      const data = {};
      const orderbody = {};
      data["encryptText"] = JSON.stringify({
        userId: "Sagar1502",
        password: "Sagar@12345",
      });

      var encrypted = jwt.sign(data, secret, {
        algorithm: "HS256",
        noTimestamp: true,
      });
      var decryptedUser = jwt.verify(encrypted, secret);
      const loginRequest = await axios.post(
        `https://www.avantgardepayments.com/agadmin/api/signUpLogin/agId/paygate`,
        { loginRequest: encrypted }
      );
      // console.log("Here is Login Response", loginRequest);
      const payload = loginRequest.data.payLoad;
      var decoded = jwt.verify(payload, secret, { algorithm: "HS256" });
      const decodeData = JSON.parse(decoded.encryptText);
      // console.log(decodeData);
      const userSessionKey = decodeData.sessionKey;
      // console.log(userSessionKey);
      const requestBody = {};
      requestBody["encryptText"] = JSON.stringify({
        firstName: fName,
        lastName: lName,
        mediaType: mediaType,
        orderId: orderId,
        amount: amount,
        product: product,
        expiryDate: expiryDate,
        country: country,
        currency: currency,
        customerEmail: customerEmail,
        mobileNo: mobileNo,
        status: "A",
        createdBy: "Kaustubh",
        successURL: `https://api.fitechs.in/transaction/success/admin/${fName}?amount=${amount}&pawti=${pawti}`,
        failureURL: `https://api.fitechs.in/transaction/failed/admin/${fName}?amount=${amount}&pawti=${pawti}`,
      });
      console.log("Here is requestBody:", requestBody);
      var userEncryption = encode("Sagar1502", userIdSecret);

      var orderBody = encode(requestBody.encryptText, merchankKeytwo);
      // console.log(orderBody);

      const createOrder = await axios.post(
        `https://www.avantgardepayments.com/agmerchant/sdk/mediaPaymentsv2/userId/Sagar1502`,
        { mediaBasedPostRequest: orderBody },
        {
          headers: {
            userId: userEncryption,
            sessionKey: userSessionKey,
          },
        }
      );
      console.log("here is order response:", createOrder);

      console.log("here is order response:", createOrder);
      const response = decrypt(createOrder.data, merchankKeytwo);
      console.log("Here is your api response:", response);
      function encode(text, skey) {
        var base64Iv = "0123456789abcdef"; // generate your key
        var key = CryptoJS.enc.Base64.parse(skey);
        var iv = CryptoJS.enc.Utf8.parse(base64Iv);
        var encrypted = CryptoJS.AES.encrypt(text, key, {
          iv: iv,
          mode: CryptoJS.mode.CBC,
          padding: CryptoJS.pad.Pkcs7,
        });
        var decryptedData = encrypted.toString();
        return decryptedData;
      }

      function decrypt(text, skey) {
        var base64Iv = "0123456789abcdef";
        var key = CryptoJS.enc.Base64.parse(skey);
        var iv = CryptoJS.enc.Utf8.parse(base64Iv);
        var decrypted = CryptoJS.AES.decrypt(text, key, {
          iv: iv,
          mode: CryptoJS.mode.CBC,
          padding: CryptoJS.pad.Pkcs7,
        });
        var decryptedData = decrypted.toString(CryptoJS.enc.Utf8);
        return decryptedData;
      }

      console.log("here is api res:", createOrder);
      res.status(200).send({ message: createOrder.data });
    } catch (err) {
      res.status(400).send({ message: err.message });
    }
  },
  payOutTwo: async (req, res) => {
    try {
      const {
        fName,
        lName,
        orderId,
        mediaType,
        amount,
        product,
        expiryDate,
        country,
        currency,
        customerEmail,
        mobileNo,
        gotra,
        purpose,
        pawti,
        pan,
      } = req.body;
      // console.log(req.body.expiryDate);
      const userId = "Sagar1502";

      const data = {};
      const orderbody = {};
      data["encryptText"] = JSON.stringify({
        userId: "Sagar1502",
        password: "Sagar@12345",
      });

      var encrypted = jwt.sign(data, secret, {
        algorithm: "HS256",
        noTimestamp: true,
      });
      var decryptedUser = jwt.verify(encrypted, secret);
      const loginRequest = await axios.post(
        `https://www.avantgardepayments.com/agadmin/api/signUpLogin/agId/paygate`,
        // `https://pguat.safexpay.com/agadmin/api/signUpLogin/agId/paygate`,
        { loginRequest: encrypted }
      );
      console.log("Here is Login Response", loginRequest);
      const payload = loginRequest.data.payLoad;
      var decoded = jwt.verify(payload, secret, { algorithm: "HS256" });
      const decodeData = JSON.parse(decoded.encryptText);
      // console.log(decodeData);
      const userSessionKey = decodeData.sessionKey;
      // console.log(userSessionKey);
      const requestBody = {};
      requestBody["encryptText"] = JSON.stringify({
        firstName: fName,
        lastName: lName,
        mediaType: mediaType,
        orderId: orderId,
        amount: amount,
        product: product,
        expiryDate: expiryDate,
        country: country,
        currency: currency,
        customerEmail: customerEmail,
        mobileNo: mobileNo,
        status: "A",
        createdBy: "Kaustubh",
        // successURL: `https://api.fitechs.in/transaction/success/${fName}/${amount}/${customerEmail}/${mobileNo}/${pawti}/${pan}`,
        successURL: `https://api.fitechs.in/transaction/success/${fName}?amount=${amount}&pawti=${pawti}`,
        failureURL: `https://api.fitechs.in/transaction/failed/${fName}?amount=${amount}&pawti=${pawti}`,
      });
      // console.log("Here is requestBody:", requestBody);
      var userEncryption = encode("Sagar1502", userIdSecret);

      var orderBody = encode(requestBody.encryptText, merchankKeytwo);
      // console.log(orderBody);

      const createOrder = await axios.post(
        `https://www.avantgardepayments.com/agmerchant/sdk/mediaPaymentsv2/userId/Sagar1502`,
        //`https://pguat.safexpay.com/agmerchant/sdk/mediaPaymentsv2/userId/Nike119`,
        { mediaBasedPostRequest: orderBody },
        {
          headers: {
            userId: userEncryption,
            sessionKey: userSessionKey,
          },
        }
      );
      // console.log("here is order response:", createOrder);

      // console.log("here is order response:", createOrder);
      const response = decrypt(createOrder.data, merchankKeytwo);
      // console.log("Here is your api response:", response);
      function encode(text, skey) {
        var base64Iv = "0123456789abcdef"; // generate your key
        var key = CryptoJS.enc.Base64.parse(skey);
        var iv = CryptoJS.enc.Utf8.parse(base64Iv);
        var encrypted = CryptoJS.AES.encrypt(text, key, {
          iv: iv,
          mode: CryptoJS.mode.CBC,
          padding: CryptoJS.pad.Pkcs7,
        });
        var decryptedData = encrypted.toString();
        return decryptedData;
      }

      function decrypt(text, skey) {
        var base64Iv = "0123456789abcdef";
        var key = CryptoJS.enc.Base64.parse(skey);
        var iv = CryptoJS.enc.Utf8.parse(base64Iv);
        var decrypted = CryptoJS.AES.decrypt(text, key, {
          iv: iv,
          mode: CryptoJS.mode.CBC,
          padding: CryptoJS.pad.Pkcs7,
        });
        var decryptedData = decrypted.toString(CryptoJS.enc.Utf8);
        return decryptedData;
      }

      // console.log("here is api res:", createOrder);
      res.status(200).send({ message: createOrder.data });
    } catch (err) {
      res.status(400).send({ message: err.message });
    }
  },
  getDailyDonations: async (req, res) => {
    try {
      const startDate = moment().subtract(7, "days").toDate();
      const endDate = moment().toDate();
      console.log(startDate);
      console.log(endDate);
      const pipeline = [
        {
          $match: {
            createdAt: {
              $gte: startDate,
              $lt: endDate,
            },
            $or: [
              { status: "success" },
              { "modeOfPayment.mode": { $in: ["Cheque", "Offline"] } },
            ],
          },
        },
        {
          $group: {
            _id: {
              $dateToString: {
                format: "%Y-%m-%d",
                date: "$createdAt",
              },
            },
            totalAmount: { $sum: "$amount" },
          },
        },
        {
          $sort: { _id: 1 },
        },
      ];

      let result = await Receipt.aggregate(pipeline).exec();
      let receipts = {};
      result.forEach(
        (receipt) => (receipts[receipt._id] = receipt.totalAmount)
      );

      const dates = [];
      for (let i = 0; i < 7; i++) {
        const date = moment().subtract(i, "days").format("YYYY-MM-DD");
        dates.push({ date, totalAmount: receipts[date] || 0 });
      }

      res.send(dates.reverse());
    } catch (err) {
      console.log(err);
      res.status(500).send({
        message: err.message,
      });
    }
  },
  getAverageReceiptAmount: async (req, res) => {
    try {
      const receipts = await Receipt.find({ status: "success" });
      let totalAmount = 0;

      receipts.forEach((receipt) => {
        totalAmount += receipt.amount;
      });

      const averageAmount = totalAmount / receipts.length;
      res.status(200).send({ averageAmount });
    } catch (error) {
      res.status(500).send({ message: "An error occured" });
    }
  },
  getReceiptsCount: async (req, res) => {
    try {
      const receipts = await Receipt.find({ status: "success" });
      const totalReceipts = receipts.length;
      if (!totalReceipts) {
        return res.status(400).send({ message: "No receipt found" });
      }
      res.status(200).send({ totalReceipts });
    } catch (error) {
      res.status(500).send({ error: error });
    }
  },
  getMostOccuringPurpose: async (req, res) => {
    try {
      const receipts = await Receipt.find({});
      const purposeCount = {};
      receipts.forEach((receipt) => {
        if (!purposeCount[receipt.purpose]) {
          purposeCount[receipt.purpose] = 1;
        } else {
          purposeCount[receipt.purpose]++;
        }
      });
      let max = 0;
      let maxKey = "";
      for (let val in purposeCount) {
        if (purposeCount[val] > max) {
          max = purposeCount[val];
          maxKey = val;
        }
      }

      res.status(200).send({ mostOccuringPurpose: maxKey });
    } catch (error) {
      console.log(error);
      res.status(500).send({ error });
    }
  },
};

module.exports = receiptController;
