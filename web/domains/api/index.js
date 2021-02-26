const router = require("express")();
router.use("/interactions", require(join(__dirname, "interactions", "index.js")));
module.exports = router;
