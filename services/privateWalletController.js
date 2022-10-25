const Web3 = require("web3");
const Cryptr = require("cryptr");
const db = require("../models/index");
const provider = process.env.BESU_PROVIDER_URL;
const web3 = new Web3(new Web3.providers.HttpProvider(provider));
const cryptr = new Cryptr(process.env.CRYPTER_SECRET_KEY);

const sendeth = async (accountBuyer) => {
  // Pre-seeded account with 90000 ETH
  const privateKeyAdmin = process.env.MUSEUM_LAB_ADMIN_WALLET_PK_PROD;
  const accountAdmin = web3.eth.accounts.privateKeyToAccount(privateKeyAdmin);

  const chainId = await web3.eth.getChainId();

  const getid = await web3.eth.net.getId();
  console.log("sending ether from ", accountAdmin);

  console.log("sending ether to ", accountBuyer);
  const rawTxOptions = {
    nonce: web3.utils.numberToHex(
      await web3.eth.getTransactionCount(accountAdmin.address)
    ),
    from: accountAdmin.address,
    to: accountBuyer.address,
    chainId,
    value: "100000000000000000", // Amount of ETH to transfer
    gasPrice: "0x0", // ETH per unit of gas
    gasLimit: "0x24A22", // Max number of gas units the tx is allowed to use
  };
  console.log({ rawTxOptions });

  const signedTx = await web3.eth.accounts.signTransaction(
    rawTxOptions,
    accountAdmin.privateKey.substring(2)
  );
  console.log({ signedTx });

  const hash = await web3.eth.sendSignedTransaction(
    signedTx.rawTransaction,
    function (error, hash) {
      if (!error) {
        console.log("🎉 The hash of your transaction is: ", hash);
      } else {
        console.log(
          "❗Something went wrong while submitting your transaction:",
          error
        );
      }
    }
  );

  return hash;
};

// eslint-disable-next-line import/prefer-default-export
const newPrivateWallet = async () => {
  // create an account
  const acc = web3.eth.accounts.create(); // web3 create accounts method
  // add private key
  web3.eth.accounts.wallet.add(acc.privateKey);
  await sendeth(acc);
  let wallet = await db.user.findOne({ custodialAddress: acc.address }).exec();
  console.log({ wallet });
  if (wallet) {
    throw new Error("The Wallet already exists!");
  }
  if (Web3.utils.isAddress(acc.address) === false) {
    throw new Error("Invalid Address");
  }
  console.log("cusss", acc.privateKey);
  const encryptedPK = cryptr.encrypt(acc.privateKey);
  console.log({
    custodialAddress: acc.address,
    custodialPrivateKey: encryptedPK,
  });
  return { custodialAddress: acc.address, custodialPrivateKey: encryptedPK };
};

const getAddress = async (user) => {
  const wallet = await db.user.findOne({ address: user.address }).lean();
  return wallet[0].address;
};

const getPK = async (user) => {
  const wallet = await db.user.find({ address: user.address }).lean();
  return cryptr.decrypt(wallet[0].privateKey);
};

const getEtherBalance = async (address) => {
  // get balance of ether
  const walletBalance = web3.utils.fromWei(await web3.eth.getBalance(address));
  const balanceEther = {
    token: "ETH",
    balance: walletBalance,
  };
  return balanceEther;
};

const crateAdminWallet = async (req, res) => {
  const encryptedPK = cryptr.encrypt(
    "2214f2e9fe1f3fadcbd29b5beb0886fddd538a5c23fcc87a7a6d56a03dd6529e"
  );

  const wallet = new PrivateWallet({
    // eslint-disable-next-line no-underscore-dangle
    user: "632c3b14c2d39bb3e1276b1b",
    name: "shill",
    address: "0x18FC93540e51dCe1375F1D9D5fc7d392C83b9409",
    privateKey: encryptedPK,
  });
  await wallet.save();
  return res.send(wallet);
};

module.exports = {
  newPrivateWallet,
  getAddress,
  getPK,
  getEtherBalance,
  crateAdminWallet,
};
