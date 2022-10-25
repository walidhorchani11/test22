const db = require("../models/index");
const fs = require("fs");
const Cryptr = require("cryptr");
const Web3 = require("web3");
const provider = process.env.BESU_PROVIDER_URL;
const web3 = new Web3(new Web3.providers.HttpProvider(provider));
const ContractERC20 = require(require("path").resolve(
  __dirname,
  "../D-euro-SC/DEURO-abi.json"
));

const getDeuroBalance = async (buyerAddress) => {
  const contract = new web3.eth.Contract(
    ContractERC20,
    process.env.D_EURO_SC_ADDRESS_PROD
  );

  const res = await contract.methods.balanceOf(buyerAddress).call();
  console.log("balance of user login", res);
  return res;
};

const deuroCashinForBuyer = async (buyerAddress, amount) => {
  const privateKeyAdmin = process.env.MUSEUM_LAB_ADMIN_WALLET_PK_PROD;
  const { address: from } =
    web3.eth.accounts.privateKeyToAccount(privateKeyAdmin);
  const contract = new web3.eth.Contract(
    ContractERC20,
    process.env.D_EURO_SC_ADDRESS_PROD
  );
  // const amountInBigInt = BigInt(amount * 1000000000000000000).toString();

  // console.log({ amountInBigInt });
  // const amountToMint = web3.utils.toBN(Math.trunc(amountInBigInt));
  // let decimals;
  // decimals = await contract.methods
  //   .decimals()
  //   .call({ from: `${buyerAddress}` });

  let amountt = BigInt(amount * 10 ** 18).toString();

  const query = await contract.methods.mint(buyerAddress, amountt);

  console.log({ contract, query, amountt, buyerAddress });

  const signed = await web3.eth.accounts.signTransaction(
    {
      to: process.env.D_EURO_SC_ADDRESS_PROD,
      from,
      value: "0",
      data: query.encodeABI(),
      // gasPrice: web3.utils.toWei('20', 'gwei'),
      gas: Math.round((await query.estimateGas({ from })) * 1.5),
      nonce: await web3.eth.getTransactionCount(from, "pending"),
    },
    privateKeyAdmin
  );

  console.log({ signed });

  const hash = await web3.eth.sendSignedTransaction(
    signed.rawTransaction,
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

  // const res = await contract.methods
  //   .mint(buyerAddress, amountToMint)
  //   .send({ from: accountAdmin.address, gas: 6500000 }, async (error, result) => {
  //     console.log({ result });

  //     if (error) {
  //       console.log({ error });

  //       return error;
  //     }
  //     console.log({ TransactionHash: result });
  //     return result;
  //   });
};

const deuroBurnForBuyer = async (buyerAddress, buyerPrivateKey, amount) => {
  // const privateKeyAdmin = process.env.MUSEUM_LAB_ADMIN_WALLET_PK_PROD;
  const { address: from } =
    web3.eth.accounts.privateKeyToAccount(buyerPrivateKey);
  const contract = new web3.eth.Contract(
    ContractERC20,
    process.env.D_EURO_SC_ADDRESS_PROD
  );
  const amountInBigInt = BigInt(amount * 1000000000000000000).toString();

  // const amountToBurn = web3.utils.toBN(Math.trunc(amountInBigInt));
  const query = await contract.methods.burn(amountInBigInt);

  console.log({
    contract,
    query,
    amountInBigInt,
    buyerAddress,
    buyerPrivateKey,
  });

  const signed = await web3.eth.accounts.signTransaction(
    {
      to: process.env.D_EURO_SC_ADDRESS_PROD,
      from,
      value: "0",
      data: query.encodeABI(),
      // gasPrice: web3.utils.toWei('20', 'gwei'),
      gas: Math.round((await query.estimateGas({ from })) * 1.5),
      nonce: await web3.eth.getTransactionCount(from, "pending"),
    },
    buyerPrivateKey
  );

  console.log({ signed });

  const hash = await web3.eth.sendSignedTransaction(
    signed.rawTransaction,
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

const deuroTransferForBuyer = async (buyerAddress, buyerPrivateKey, amount) => {
  // const privateKeyAdmin = process.env.MUSEUM_LAB_ADMIN_WALLET_PK_PROD;
  const { address: from } =
    web3.eth.accounts.privateKeyToAccount(buyerPrivateKey);
  const contract = new web3.eth.Contract(
    ContractERC20,
    process.env.D_EURO_SC_ADDRESS_PROD
  );
  const amountInBigInt = BigInt(
    amount * 1.025 * 1000000000000000000
  ).toString();

  // const amountToTransfer = web3.utils.toBN(Math.trunc(amountInBigInt));
  const query = await contract.methods.transfer(
    process.env.MUSEUM_LAB_ADMIN_WALLET_ADDRESS_PROD,
    amountInBigInt
  );

  console.log({
    contract,
    query,
    amountInBigInt,
    buyerAddress,
    buyerPrivateKey,
  });

  const signed = await web3.eth.accounts.signTransaction(
    {
      to: process.env.D_EURO_SC_ADDRESS_PROD,
      from,
      value: "0",
      data: query.encodeABI(),
      // gasPrice: web3.utils.toWei('20', 'gwei'),
      gas: Math.round((await query.estimateGas({ from })) * 1.5),
      nonce: await web3.eth.getTransactionCount(from, "pending"),
    },
    buyerPrivateKey
  );

  console.log({ signed });

  const hash = await web3.eth.sendSignedTransaction(
    signed.rawTransaction,
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

module.exports = {
  getDeuroBalance,
  deuroCashinForBuyer,
  deuroBurnForBuyer,
  deuroTransferForBuyer,
  // createToken,
  // getTokenAddress,
  // getTokensNameList,
  // Reward,
  // rewardSignin,
  // transferUserToken,
  // burnUserToken,
};

// *************************************************************************************************

// const createToken = async (user, wallet) => {
//   try {
//     // eslint-disable-next-line no-use-before-define

//     const addressFrom = wallet.address;
//     const privateKey = cryptr.decrypt(wallet.privateKey);
//     web3.eth.accounts.wallet.add(privateKey);
//     const contract = new web3.eth.Contract(ContractERC20.Abi);
//     const tokenName = user.twitter_username;
//     const token = await Token.findOne({ name: tokenName });
//     if (token) {
//       throw new Error("Token exists !");
//     }
//     let transactionHash = 0;
//     // deploy the smart contract using the method deploy
//     const { _address } = await contract
//       .deploy({
//         data: bytecode.body,
//         arguments: [tokenName],
//       })
//       .send({ from: addressFrom, gas: 5000000 }, (error, result) => {
//         transactionHash = result;
//       })
//       .on("error", (error) => {
//         throw new Error({ error: error.message });
//       });
//     const newToken = new Token({
//       address: _address,
//       name: tokenName,
//       transactionHash,
//       // eslint-disable-next-line no-underscore-dangle
//       creator: user._id,
//       social_invest: [{ totalSupply: 1, socialPrice: 1000 }],
//     });

//     await newToken.save();
//     return newToken;
//   } catch (error) {
//     throw new Error(error.message);
//   }
// };

// const getTokenAddress = async (name) => {
//   const token = await Token.find({ name }).lean();
//   return token[0].address;
// };

// const getTokensNameList = async () => {
//   const tokensNames = [];
//   const tokensList = await Token.find({}).lean();

//   tokensList.forEach((token) => {
//     tokensNames.push(token.name);
//   });
//   return tokensNames;
// };

// /*
//  * calcul of the user reward using the bond curve
//  * inputs : token symbol => used to get the token address from the db / recipient = the address to transfer the tokens to / nb_followers = user's followers number
//  *
//  */
// const Reward = async (user, recipient, nbFollowers) => {
//   const userToken = await Token.findOne({ name: user.twitter_username }).lean();
//   const tokenAddress = userToken.address;

//   // create ERC20 token instance using the abi and the address
//   const TokenSC = new web3.eth.Contract(ContractERC20.Abi, tokenAddress);
//   const totalSupply = await TokenSC.methods.totalSupply().call();
//   const totalSupplyValue = totalSupply / 1000000000000000000;
//   const toAddress = recipient;

//   // bond curve params : static
//   const m = 10;
//   const b = 0;
//   const ar = 0.05;

//   let tokenPrice = 0;
//   const log = Math.log2(totalSupplyValue);
//   tokenPrice = m * (1 + ar) ** log + b; // bond curve

//   if (nbFollowers === 0) {
//     // the user must have at least 1 follower : required for the bond curve
//     throw new Error("User must have at least one follower");
//   } else {
//     // the reward that will be transferred
//     const totalreward = nbFollowers / tokenPrice;

//     const Amount = web3.utils.toBN(
//       Math.trunc(totalreward * 1000000000000000000)
//     );

//     const deploymentAccountAddress = await getAddress(user.twitter_username); // deploymentAccount = shill admin account ( genesis.json)

//     const pk = await getPK(user.twitter_username);
//     const addressFrom = deploymentAccountAddress;

//     const transferReward = async () => {
//       console.log("pk from function", pk);

//       web3.eth.accounts.wallet.add(pk);

//       const res = await TokenSC.methods
//         .mint(toAddress, Amount)
//         .send({ from: addressFrom, gas: 6500000 }, async (error, result) => {
//           console.log({ TransactionHash: result });
//         });

//       if (res) {
//         const newSupply = await TokenSC.methods.totalSupply().call();
//         const newSupplyValue = newSupply / 1000000000000000000;
//         // update the db the the new object { supply, token price} required for drawing the curve
//         await Token.updateOne(
//           { name: user.twitter_username },
//           {
//             $push: {
//               social_invest: {
//                 totalSupply: newSupplyValue,
//                 socialPrice: tokenPrice,
//               },
//             },
//           }
//         );
//       }
//     };

//     await transferReward();
//   }
// };

// const rewardSignin = async (user, recipient, nbFollowers) => {
//   const userToken = await Token.findOne({ name: user.twitter_username }).lean();
//   const tokenAddress = userToken.address;

//   // create ERC20 token instance using the abi and the address
//   const TokenSC = new web3.eth.Contract(ContractERC20.Abi, tokenAddress);
//   const totalSupply = await TokenSC.methods.totalSupply().call();
//   const totalSupplyValue = totalSupply / 1000000000000000000;
//   const toAddress = recipient;

//   // bond curve params : static
//   const m = 10;
//   const b = 0;
//   const ar = 0.05;

//   let tokenPrice = 0;
//   const log = Math.log2(totalSupplyValue);
//   tokenPrice = m * (1 + ar) ** log + b; // bond curve

//   if (nbFollowers === 0) {
//     // the user must have at least 1 follower : required for the bond curve
//     throw new Error("User must have at least one follower");
//   } else {
//     // the reward that will be transferred
//     const totalreward = nbFollowers / tokenPrice;
//     const userReward = (totalreward * 90) / 100;
//     const platformReward = totalreward - userReward;

//     const userRewardAmount = web3.utils.toBN(
//       Math.trunc(userReward * 1000000000000000000)
//     );

//     const platformRewardAmount = web3.utils.toBN(
//       Math.trunc(platformReward * 1000000000000000000)
//     );

//     const deploymentAccountAddress = await getAddress(user.twitter_username); // deploymentAccount = shill admin account ( genesis.json)

//     const pk = await getPK(user.twitter_username);
//     const addressFrom = deploymentAccountAddress;
//     const shillEscrow = await getUserEscrow(user.twitter_username);
//     const shillEscrowAddress = shillEscrow.address;
//     console.log("ESC: ", shillEscrowAddress);
//     const transferUserReward = async () => {
//       console.log("pk from function", pk);

//       web3.eth.accounts.wallet.add(pk);

//       await TokenSC.methods
//         .mint(toAddress, userRewardAmount)
//         .send({ from: addressFrom, gas: 6500000 }, async (error, result) => {
//           console.log({ transactionHash: result });
//           return result;
//         });
//     };

//     const transferPlatformReward = async () => {
//       console.log("pk from function", pk);

//       web3.eth.accounts.wallet.add(pk);

//       await TokenSC.methods
//         .mint(shillEscrowAddress, platformRewardAmount)
//         .send({ from: addressFrom, gas: 6500000 }, async (error, result) => {
//           console.log({ transactionHash: result });
//           return result;
//         });
//     };

//     const userTransactionHash = await transferUserReward();

//     const platformTransactionHash = await transferPlatformReward();

//     if (platformTransactionHash && userTransactionHash) {
//       const newSupply = await TokenSC.methods.totalSupply().call();
//       const newSupplyValue = newSupply / 1000000000000000000;
//       // update the db the the new object { supply, token price} required for drawing the curve
//       await Token.updateOne(
//         { name: user.twitter_username },
//         {
//           $push: {
//             social_invest: {
//               totalSupply: newSupplyValue,
//               socialPrice: tokenPrice,
//             },
//           },
//         }
//       );
//     }
//   }
// };

// const transferUserToken = async (toAddress, tokenAddress, user, amount) => {
//   // Use BigNumber
//   const value = web3.utils.toBN(Math.trunc(amount * 1000000000000000000));
//   // Get ERC20 Token contract instance
//   const TokenSC = new web3.eth.Contract(ContractERC20.Abi, tokenAddress);
//   const pk = await getPK(user.twitter_username);

//   web3.eth.accounts.wallet.add(pk);
//   // calculate ERC20 token amount
//   let transactionHash = "";
//   // call transfer function
//   TokenSC.methods
//     .transfer(toAddress, value)
//     .send(
//       { from: user.wallet_address, gas: 6500000 },
//       async (error, result) => {
//         transactionHash = result;
//         console.log({ TransactionHash: result });
//         if (error) throw new Error(error);
//       }
//     );

//   return transactionHash;
// };

// const burnUserToken = async (user, amount, tokenAddress) => {
//   // Use BigNumber
//   const value = web3.utils.toBN(Math.trunc(amount * 1000000000000000000));
//   // Get ERC20 Token contract instance
//   const TokenSC = new web3.eth.Contract(ContractERC20.Abi, tokenAddress);
//   const pk = await getPK(user.twitter_username);
//   web3.eth.accounts.wallet.add(pk);
//   // calculate ERC20 token amount
//   let transactionHash = "";
//   // call transfer function
//   TokenSC.methods
//     .burn(value)
//     .send(
//       { from: user.wallet_address, gas: 6500000 },
//       async (error, result) => {
//         transactionHash = result;
//         console.log({ TransactionHash: result });
//         if (error) throw new Error(error);
//       }
//     );

//   return transactionHash;
// };
