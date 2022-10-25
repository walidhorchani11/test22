const express = require("express");
const router = express.Router();
const { authenticateJWT } = require("../middlewares/verifyJWT");
const {
  // purchaseNFT,
  // buyTest,
  // checkBalance,
  getAllTransactions,
  buyNFT,
  cashinDeuro,
  cashinDeuroAccepted,
  cashinDeuroRejected,
} = require("../services/transaction");

router.post("/", authenticateJWT, async (req, res, next) => {
  const { userId } = req.body;
  try {
    const result = await getAllTransactions(userId);
    res.send(result);
  } catch (error) {
    console.log(error);
    res.status(500).send(error.message);
  }
});

router.post("/buyNFT", authenticateJWT, async (req, res, next) => {
  const { userId, metamask_address, asset, price, quantity } = req.body;
  try {
    const result = await buyNFT(
      userId,
      metamask_address,
      asset,
      price,
      quantity
    );
    res.send(result);
  } catch (error) {
    console.log(error);
    res.status(500).send(error.message);
  }
});

router.post("/cashinDeuro", authenticateJWT, async (req, res, next) => {
  const { userId, price } = req.body;
  try {
    const result = await cashinDeuro(userId, price);
    res.send(result);
  } catch (error) {
    console.log(error);
    res.status(500).send(error.message);
  }
});
router.post("/cashinDeuroAccepted", async (req, res, next) => {
  const { mongoTransactionId } = req.query;
  try {
    const result = await cashinDeuroAccepted(mongoTransactionId);
    res.send(result);
  } catch (error) {
    console.log(error);
    res.status(500).send(error.message);
  }
});
router.post("/cashinDeuroRejected", async (req, res, next) => {
  const { mongoTransactionId } = req.query;
  try {
    const result = await cashinDeuroRejected(mongoTransactionId);
    res.send(result);
  } catch (error) {
    console.log(error);
    res.status(500).send(error.message);
  }
});

module.exports = router;

// router.post("/buy", async (req, res, next) => {
//   const {
//     userId,
//     assetContractAddress,
//     tokenId,
//     order,
//     metamask_address,
//     token,
//     password,
//     quantity,
//     price,
//   } = req.body;
//   try {
//     const result = await purchaseNFT(
//       userId,
//       assetContractAddress,
//       tokenId,
//       order,
//       metamask_address,
//       token,
//       password,
//       quantity,
//       price
//     );
//     res.send(result);
//   } catch (error) {
//     console.log(error);
//     res.status(error.status);
//     res.send(error.message);
//   }
// });

// router.post("/buyTest", async (req, res, next) => {
//   const { assetContractAddress, tokenId, metamask_address, quantity } =
//     req.body;
//   try {
//     const result = await buyTest(
//       assetContractAddress,
//       tokenId,
//       metamask_address,
//       quantity
//     );
//     res.send(result);
//   } catch (error) {
//     console.log(error);
//     res.status(error.status);
//     res.send(error.message);
//   }
// });

// router.get("/check", async (req, res, next) => {
//   try {
//     const result = await checkBalance();
//     res.send(result);
//   } catch (error) {
//     console.log(error);
//     res.status(error.status);
//     res.send(error.message);
//   }
// });
