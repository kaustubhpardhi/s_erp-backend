const merchantKey = "vT11bhGTmZHslsUNYl1Mh9H/wMuuKww/Mo7gaoe8YBg=";
const Receipt = require("../models/receiptModel");
const nodemailer = require("nodemailer");

const transactionController = {
  successfulTransaction: async (req, res) => {
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

    const pawatiNumber = req.query.pawti;
    try {
      const previousTransaction = await Receipt.find({ status: "success" })
        .sort({ successfulTransactionNumber: -1 })
        .limit(1);
      let successfulTransactionNumber;
      if (previousTransaction.length > 0) {
        successfulTransactionNumber =
          previousTransaction[0].successfulTransactionNumber + 1;
      } else {
        successfulTransactionNumber = 1;
      }
      const result = await Receipt.findOneAndUpdate(
        { pawatiNumber: pawatiNumber },
        {
          $set: {
            status: "success",
            successfulTransactionNumber: successfulTransactionNumber,
          },
        }
      );

      console.log(result);
    } catch (error) {
      console.log(error);
    }
    const receipt = await Receipt.findOne({ pawatiNumber: pawatiNumber });
    await new Promise((resolve, reject) => {
      const transporter = nodemailer.createTransport({
        host: "smtp.gmail.com",
        port: 587,
        ignoreTLS: false,
        secure: false,
        auth: {
          user: "niradeosthan@gmail.com",
          pass: "cfwodqqliaiadext",
        },
      });

      const mailOptions = {
        from: "niradeosthan@gmail.com",
        to: receipt.email,
        subject: "Successfull Receipt Confirmation",
        text: "Thankyou you , your receipt has been generated successfully. We greatly appreciate your donation ",
      };

      transporter.sendMail(mailOptions, function (error, info) {
        if (error) {
          console.log(error);
          reject({ message: "an error has occurred" });
        } else {
          resolve({ message: "Email sent successfully" });
        }
      });
    });
    Receipt.findOne({ pawatiNumber: pawatiNumber }, (error, receipt) => {
      if (error) {
        res.send(error);
      } else {
        console.log(receipt);
        res.send(`
          <div
            class="pdfBody"
            style="
              padding-top: 4px;
              padding-left: 6px;
              background: rgb(255, 255, 153);
              border: 1px solid black;
              width: auto;
              height:auto;
            "
          >
            <h5
              style="
                color: #8c2d29;
                font-weight: 700;
                text-align: center;
                margin-top: 3px;
                font-size:30px;
              "
            >
            श्री लक्ष्मी नृसिंह देवस्थान ट्रस्ट नीरा नरसिंहपुर
            </h5>
            <div>
            <h4
            style="
            color: #8c2d29;
            font-weight: 500;
            text-align: center;
            margin-top: -40px;
            font-size:20px;
          "
            >
            
            (पब्लिक ट्रस्ट र. नं. ए. / ५८ पुणे)  PAN No. :AAATS6138B  Phone No. +91 9665882895
            </h4>
            </div>
            <div
              class="printFlex"
              style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 3px">
              <div style="text-align:center">
              <img src="https://drive.google.com/thumbnail?id=1x1gyir0VHW018wd8Mfwa6zsHsm6EmqxW" alt="GodImage" width="320" height="300" />
                <p class="pdfAmount" style="font-size: 24px; text-align: center">
                  <b>Amount :₹${receipt.amount} </b> 
                </p>
              </div>
              <div>
                <table style="text-align: left" class="pdfTable">
                  <tbody>
                    <tr>
                      <th>Name</th>
                      <td>${receipt.Name}</td>
                    </tr>
                    <tr>
                      <th>Mobile</th>
                      <td>${receipt.mobileNumber}</td>
                    </tr>
                    <tr>
                      <th>Email</th>
                      <td>${receipt.email}</td>
                    </tr>
                    <tr>
                      <th>Receipt No</th>
                      <td>${receipt.pawatiNumber}</td>
                    </tr>
                    <tr>
                      <th>Receipt Date</th>
                      <td>${receipt.receiptDate}</td>
                    </tr>
                    <tr>
                    <th>Gotra</th>
                    <td>${receipt.gotra}</td>
                  </tr>
                  <tr>
                  <th>Purpose</th>
                  <td>${receipt.purpose}</td>
                </tr>
                
                  </tbody>
                </table>
              </div>
            </div>
            <div class="pdfBottom" style="display: grid; grid-template-columns: 2fr 1fr; gap: 1; align-items: center; padding-top: 10px">
  <div class="pdfBottomFirst" style="text-align: center">
  ट्रस्ट को दान आयकर अधिनियम की धारा 80 जी के तहत छूट प्राप्त है AAATS6138BF1974201
    <br />
    नीरा नरसिंहपुर, इंदापुर तालुका, महाराष्ट्र 413211  </div>
  <div class="pdfBottomSecond" style="display: flex">
    <div style="margin-left: auto">
      <img
        class="pdfBottomImg"
        src=" https://drive.google.com/thumbnail?id=17W8x7xDGew0VYuMU3k_sQqyhCbdqXx38"
        style="max-width: 150px; display: block; margin-left: auto; margin-bottom: 16px"
        alt=""
      />
  
    </div>
  </div>
</div
          </div>
          <div style="text-align:center;padding-bottom:10px; margin-top:15px;">
          <button onclick="window.print()" style="background: rgb(255, 255, 153); border: 1px solid black; color: #8c2d29; font-weight: 700;height: 40px; width: 120px;">Download Receipt</button>
          </div>
        `);
      }
    });
  },
  failedTransaction: async (req, res) => {
    const pawatiNumber = req.query.pawti;
    try {
      const result = await Receipt.findOneAndUpdate(
        { pawatiNumber: pawatiNumber },
        { $set: { status: "failed" } }
      );
      console.log(result);
    } catch (error) {
      console.log(error);
    }
    res.send(
      `<html>
      <head>
        <title>Transaction Failed</title>
      </head>
      <body style="background: rgb(255, 255, 153);">
        <h1 style="color: #8c2d29; font-weight: 700; text-align: center;">Your transaction has failed. Please try again.</h1>
      </body>
    </html>`
    );
  },
  successfulTransactionAdmin: async (req, res) => {
    const pawatiNumber = req.query.pawti;
    try {
      const previousTransaction = await Receipt.find({ status: "success" })
        .sort({ successfulTransactionNumber: -1 })
        .limit(1);
      let successfulTransactionNumber;
      if (previousTransaction.length > 0) {
        successfulTransactionNumber =
          previousTransaction[0].successfulTransactionNumber + 1;
      } else {
        successfulTransactionNumber = 1;
      }
      const result = await Receipt.findOneAndUpdate(
        { pawatiNumber: pawatiNumber },
        {
          $set: {
            status: "success",
            successfulTransactionNumber: successfulTransactionNumber,
          },
        }
      );
      const receipt = await Receipt.findOne({ pawatiNumber: pawatiNumber });
      await new Promise((resolve, reject) => {
        const transporter = nodemailer.createTransport({
          host: "smtp.gmail.com",
          port: 587,
          ignoreTLS: false,
          secure: false,
          auth: {
            user: "niradeosthan@gmail.com",
            pass: "cfwodqqliaiadext",
          },
        });

        const mailOptions = {
          from: "niradeosthan@gmail.com",
          to: receipt.email,
          subject: "Successfull Receipt Confirmation",
          text: "Thankyou you , your receipt has been generated successfully. We greatly appreciate your donation ",
        };

        transporter.sendMail(mailOptions, function (error, info) {
          if (error) {
            console.log(error);
            reject({ message: "an error has occurred" });
          } else {
            resolve({ message: "Email sent successfully" });
          }
        });
      });

      console.log(result);
    } catch (error) {
      console.log(error);
    }
    res.send(`<html>
    <head>
      <title>Transaction Success</title>
    </head>
    <body style="background: rgb(255, 255, 153);">
      <h1 style="color: #8c2d29; font-weight: 700; text-align: center;">Thank you , your receipt is generating</h1>
    </body>
  </html>`);
  },
  failedTransactionAdmin: async (req, res) => {
    const pawatiNumber = req.query.pawti;
    try {
      const result = await Receipt.findOneAndUpdate(
        { pawatiNumber: pawatiNumber },
        { $set: { status: "failed" } }
      );
      console.log(result);
    } catch (error) {
      console.log(error);
    }
    res.send(
      `<html>
      <head>
        <title>Transaction Failed</title>
      </head>
      <body style="background: rgb(255, 255, 153);">
        <h1 style="color: #8c2d29; font-weight: 700; text-align: center;">Your transaction has failed. Please try again.</h1>
      </body>
    </html>`
    );
  },
};

module.exports = transactionController;
