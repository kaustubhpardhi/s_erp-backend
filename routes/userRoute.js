const router = require("express").Router();
const userController = require("../controllers/userController");
const auth = require("../middlewares/auth");
const authAdmin = require("../middlewares/authAdmin");

router.post("/register", userController.register);

router.post("/activation", userController.activateEmail);

router.post("/login", userController.login);

router.post("/refresh_token", userController.getAccessToken);

router.post("/forgotPassword", userController.forgotPassword);

router.post("/reset", auth, userController.resetPassword);

router.get("/infor", auth, userController.getUserInfor);

router.get("/user-info/:id", auth, authAdmin, userController.getUserInfoById);

router.get("/all_infor", auth, authAdmin, userController.getUsersAllInfor);

router.get("/logout", userController.logout);

router.patch("/update", auth, userController.updateUser);

router.patch(
  "/update_role/:id",
  auth,
  authAdmin,
  userController.updateUsersRole
);

router.delete("/delete/:id", auth, authAdmin, userController.deleteUser);

module.exports = router;
