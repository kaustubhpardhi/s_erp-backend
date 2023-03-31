const router = require("express").Router();
const ornamentController = require("../controllers/ornamentController");

router.post("/create-ornament-receipt", ornamentController.createReceipt);
router.get("/check-ornament-pawati", ornamentController.checkReceipt);

module.exports = router;
