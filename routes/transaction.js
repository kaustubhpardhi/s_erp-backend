const router = require("express").Router();
const transactionController = require("../controllers/transactionController");

router.post("/success/:fName", transactionController.successfulTransaction);
router.post("/failed/:fName", transactionController.failedTransaction);
router.post(
  "/success/admin/:fname",
  transactionController.successfulTransactionAdmin
);
router.post(
  "/failed/admin/:fname",
  transactionController.failedTransactionAdmin
);

module.exports = router;
