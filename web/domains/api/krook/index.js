const router = require("express").Router();
router.use("/webhooks", require(join(__dirname, "webhooks", "index.js")));
module.exports = router;
