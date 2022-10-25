const axios = require("axios");
const db = require("../models/index");
const Cryptr = require("cryptr");
const cryptr = new Cryptr(process.env.CRYPTER_SECRET_KEY);
const { Seaport } = require("@opensea/seaport-js");
const { ethers } = require("ethers");
const { OpenSeaSDK, Network } = require("opensea-js");
const Web3 = require("web3");
const {
  transactionStatusList,
  transactionTypeList,
} = require("../constants/constants");
const {
  deuroTransferForBuyer,
  deuroBurnForBuyer,
  deuroCashinForBuyer,
  getDeuroBalance,
} = require("./tokenController");
const { genToken } = require("../utils/genToken");
const openSeaProvider = new Web3.providers.HttpProvider(
  process.env.ALCHEMY_JSON_RPC_PROVIDER_GOERLI
);
const openseaSDK = new OpenSeaSDK(openSeaProvider);

// create the connection
let web3 = new Web3(process.env.ALCHEMY_JSON_RPC_PROVIDER_GOERLI);

let api = require("etherscan-api").init(
  "UF1X9YIGSX7PJJMMPCYDSGRVJIRYJ6F2U3",
  "goerli"
);
const provider = new ethers.providers.JsonRpcProvider(
  process.env.ALCHEMY_JSON_RPC_PROVIDER_GOERLI
);

const signer = new ethers.Wallet(
  process.env.PRIVATE_WALLET_KEY_GOERLI,
  provider
);
const seaport = new Seaport(signer);

async function exchange() {
  const res = await axios.get(
    "https://api.binance.com/api/v3/avgPrice?symbol=ETHEUR"
  );
  return res.data.price;
}
const checkBalance = async (web3) => {
  const ethToEuro = await exchange();

  const balance = await web3.eth.getBalance(process.env.WALLET_ADDRESS_GOERLI);
  const adminBalance = balance / Math.pow(10, 18);
  console.log("ethToEuro:", ethToEuro);
  console.log("admin balance in eth::", adminBalance);

  console.log("admin balance in euro::", adminBalance * ethToEuro);
  return adminBalance * ethToEuro;
};

const getAllTransactions = async (userId) => {
  let mongoTransactions = [];
  let user;
  let resUser = {};
  try {
    mongoTransactions = await db.transaction.find({ buyer: userId }).exec();
    console.log({ mongoTransactions });
    // GET BESU BALANCE USER
    try {
      user = await db.user.findById(userId).exec();
      const myNewBalance = await getDeuroBalance(user.custodialAddress);
      const deuro_balance = myNewBalance / 10 ** 18;
      const mongoUser = await db.user
        .findByIdAndUpdate(user?._id, { deuro_balance }, { new: true })
        .exec();
      const token = genToken(user);
      resUser = { ...mongoUser?._doc, token };
    } catch (error) {
      throw error;
    }
    return { resUser, mongoTransactions };
  } catch (error) {
    throw error;
  }
};

const buyNFT = async (userId, metamask_address, asset, price, quantity) => {
  const { address: assetContractAddress } = asset.asset_contract;
  const { token_id: tokenId } = asset;
  const { protocol_data: order } = asset.seaport_sell_orders[0];
  let mongoTransaction;
  let user;
  // finding user first
  try {
    user = await db.user.findById(userId).exec();
  } catch (error) {
    throw error;
  }

  // Creating Transaction
  try {
    let transaction = {
      buyer: userId,
      metamask_address,
      price,
      asset,
      type: transactionTypeList.buyNFT,
    };
    mongoTransaction = await db.transaction.create(transaction);
    console.log({ mongoTransaction });
  } catch (error) {
    throw error;
  }

  // Check wallet_admin_goerli if it has enough balance
  try {
    const adminBalanceGoerli = await checkBalance(web3);
    console.log({ adminBalanceGoerli, price });
    if (adminBalanceGoerli < parseFloat(price)) {
      throw new Error("admin balance is not enough");
    }
  } catch (error) {
    throw error;
  }

  // Buy the nft for the buyer
  try {
    const result = await seaportBuyNFT(
      assetContractAddress,
      tokenId,
      metamask_address,
      quantity
    );
    console.log("result after Buying NFT", result);
  } catch (error) {
    try {
      const mongoTransactionRejected = await db.transaction.findByIdAndUpdate(
        mongoTransaction._id,
        { status: transactionStatusList.rejected },
        { new: true }
      );
      console.log({ mongoTransactionRejected });
    } catch (error) {
      throw error;
    }
    throw error;
  }

  // Transfer the price from buyer Address to admin besu wallet
  try {
    const floatPrice = parseFloat(price);
    console.log({ floatPrice });
    const userPK = cryptr.decrypt(user?.custodialPrivateKey);
    const res = await deuroTransferForBuyer(
      user?.custodialAddress,
      userPK,
      floatPrice
    );

    console.log({ transferRes: res });
  } catch (error) {
    try {
      const mongoTransactionRejected = await db.transaction.findByIdAndUpdate(
        mongoTransaction._id,
        { status: transactionStatusList.rejected },
        { new: true }
      );
      console.log({ mongoTransactionRejected });
    } catch (error) {
      throw error;
    }
    throw error;
  }

  // Change the state of transaction to validated
  try {
    const mongoTransactionValidated = await db.transaction.findByIdAndUpdate(
      mongoTransaction._id,
      { status: transactionStatusList.validated },
      { new: true }
    );
    console.log({ mongoTransactionValidated });
    const myNewBalance = await getDeuroBalance(user.custodialAddress);
    const deuro_balance = myNewBalance / 10 ** 18;
    const mongoUser = await db.user
      .findByIdAndUpdate(user._id, { deuro_balance }, { new: true })
      .exec();
    const token = genToken(user);

    const resUser = { ...mongoUser?._doc, token };
    return { user: resUser, mongoTransactionValidated };
  } catch (error) {
    throw error;
  }
};

const cashinDeuro = async (userId, price) => {
  let transaction = {
    buyer: userId,
    price,
  };
  const mongoTransaction = await db.transaction.create(transaction);
  console.log({ mongoTransaction });
  const response = await axios.post(
    process.env.PSP_URL + "/initialize-payment",
    {
      amountInCents: price * 100,
      confirmationURL: process.env.MUSEUM_FRONT + "/payment-success",
      errorURL: process.env.MUSEUM_FRONT + "/payment-error",
      paymentInternalId: mongoTransaction?._id,
      language: "EN",
      remittanceInfo: "test",
      backendConfirmationURL:
        process.env.MUSEUM_BACK +
        `/transaction/cashinDeuroAccepted?mongoTransactionId=${mongoTransaction?._id}`,
      backendErrorURL:
        process.env.MUSEUM_BACK +
        `/transaction/cashinDeuroRejected?mongoTransactionId=${mongoTransaction?._id}`,
    }
  );

  return { url: response.data };
};

const cashinDeuroAccepted = async (mongoTransactionId) => {
  let res, mongoTransaction;
  try {
    const mongoTransaction = await db.transaction
      .findById(mongoTransactionId)
      .exec();
    const user = await db.user.findById(mongoTransaction.buyer).exec();
    res = await deuroCashinForBuyer(
      user?.custodialAddress,
      mongoTransaction.price
    );
  } catch (error) {
    throw error;
  }
  try {
    mongoTransaction = await db.transaction
      .findByIdAndUpdate(
        mongoTransactionId,
        { status: transactionStatusList.validated },
        { new: true }
      )
      .exec();
    console.log({ mongoTransaction });
  } catch (error) {
    throw error;
  }

  return { res, mongoTransaction };
};

const cashinDeuroRejected = async (mongoTransactionId) => {
  const mongoTransaction = await db.transaction
    .findByIdAndUpdate(
      mongoTransactionId,
      { status: transactionStatusList.rejected },
      { new: true }
    )
    .exec();

  return { res: mongoTransaction };
};

const seaportBuyNFT = async (
  assetContractAddress,
  tokenId,
  metamask_address,
  quantity
) => {
  // let estimatedGasPrice = await estimateFees();
  // console.log(estimatedGasPrice);

  const providerGoerli = new ethers.providers.JsonRpcProvider(
    process.env.ALCHEMY_JSON_RPC_PROVIDER_GOERLI
  );

  const signerGoerli = new ethers.Wallet(
    process.env.PRIVATE_WALLET_KEY_GOERLI,
    providerGoerli
  );

  const signerMnemonic = ethers.Wallet.fromMnemonic(
    "truth process prevent concert initial body position govern green beauty sniff jeans"
  );
  console.log({
    provider,
    providerGoerli,
    signer,
    signerGoerli,
    signerMnemonic,
  });
  const seaportGoerli = new Seaport(signerGoerli);

  let orders;
  const options = {
    method: "GET",

    url:
      "https://testnets-api.opensea.io/v2/orders/goerli/seaport/listings?asset_contract_address=" +
      assetContractAddress +
      "&token_ids=" +
      tokenId,

    headers: {
      Accept: "application/json",
      "X-API-KEY": `${process.env.OPENSEA_API_KEY}`,
    },
  };
  try {
    orders = await axios.request(options);
  } catch (error) {
    console.log("error in getting nft");
    console.log(error);
    throw error;
  }

  let order = orders?.data?.orders[0]?.protocol_data;
  try {
    const { executeAllActions: executeAllFulfillActions } =
      await seaportGoerli.fulfillOrder({
        order,
        unitsToFill: quantity,
        accountAddress: process.env.WALLET_ADDRESS_GOERLI,
        conduitKey: process.env.CONDUIT_KEY_GOERLI,
        recipientAddress: metamask_address,
      });
    const transaction = await executeAllFulfillActions();
    console.log("hash after fullfill", transaction.hash);
    // let res = await api.proxy.eth_getTransactionByHash(transaction.hash);
    // const hexDec = (hex) => parseInt(hex, 16);
    // const gas = hexDec(res.result.gas);
    // let gasPrice = hexDec(res.result.gasPrice);
    // const first2Str = String(gasPrice).slice(0, 2); // 👉️ '13'
    // gasPrice = Number(first2Str);
    // let fees = (gas * gasPrice) / Math.pow(10, 10);
    // console.log(fees);
    // const eurFees = (await exchange()) * fees;

    return { transaction };
  } catch (error) {
    console.log("error in buying");
    console.log(error);
    throw error;
  }
};

module.exports = {
  // purchaseNFT,
  // buyTest,
  // checkBalance,
  getAllTransactions,
  buyNFT,
  cashinDeuro,
  cashinDeuroAccepted,
  cashinDeuroRejected,
};

// const estimateFees = async () => {
//   let estimatedGasPrice =
//     (await openseaSDK._computeGasPrice()).toString() / 1e9;
//   console.log(estimatedGasPrice);
//   return estimatedGasPrice;
// };

// const buy = async (order, metamask_address, quantity) => {
//   try {
//     const { executeAllActions: executeAllFulfillActions } =
//       await seaport.fulfillOrder({
//         order,
//         unitsToFill: quantity,
//         accountAddress: process.env.WALLET_ADDRESS_GOERLI,
//         conduitKey: process.env.CONDUIT_KEY_GOERLI,
//         recipientAddress: metamask_address,
//       });
//     const transaction = await executeAllFulfillActions();
//     var res = await api.proxy.eth_getTransactionByHash(transaction.hash);
//     const hexDec = (hex) => parseInt(hex, 16);
//     const gas = hexDec(res.result.gas);
//     let gasPrice = hexDec(res.result.gasPrice);
//     const first2Str = String(gasPrice).slice(0, 2); // 👉️ '13'
//     gasPrice = Number(first2Str);
//     var fees = (gas * gasPrice) / Math.pow(10, 10);
//     console.log("fees", fees);
//     const eurFees = (await exchange()) * fees;

//     return eurFees;
//   } catch (error) {
//     console.log("error in buying");
//     console.log(error);
//     throw error;
//   }
// };

// const sendDeuro = async (token, password, total) => {
//   //transfer euro amount to the system deuro wallet
//   const headers = {
//     Authorization: token,
//   };
//   const response = await axios.post(
//     process.env.DEVENTURL + "/wallet/send",
//     {
//       partner_id: "9",
//       password: password,
//       amount: total.toString(),
//       message: "purchasing NFT",
//     },
//     {
//       headers: headers,
//     }
//   );
//   if (response.data.status == "error") {
//     console.log("error in sending");
//     throw { status: 500, message: response.data.message };
//   }
// };

// const purchaseNFT = async (
//   userId,
//   assetContractAddress,
//   tokenId,
//   order,
//   metamask_address,
//   token,
//   password,
//   quantity,
//   price
// ) => {
//   let transaction = {
//     buyer: userId,
//     asset: { assetContractAddress, tokenId },
//     price,
//     metamask_address,
//   };

//   let balance = checkBalance();
//   let estimatedGasPrice = estimateFees();

//   transaction = await db.transaction.create(transaction);
//   let total = parseInt(price);
//   try {
//     total += await buy(order, metamask_address, quantity);
//     console.log("estimatedGasPrice", estimatedGasPrice);
//   } catch (error) {
//     transaction = await db.transaction.findOneAndUpdate(
//       { _id: transaction._id },
//       { status: transactionStatusList.rejected },
//       { returnOriginal: false }
//     );
//     throw error;
//   }

//   transaction = await db.transaction.findOneAndUpdate(
//     { _id: transaction._id },
//     { status: transactionStatusList.validated, price: total.toString() },
//     { returnOriginal: false }
//   );

//   return transaction;
// };
