const db = require("../models/index");
const { default: axios } = require("axios");
const { userTypeList } = require("../constants/constants");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const { genToken } = require("../utils/genToken");
const { newPrivateWallet } = require("./privateWalletController");
const {
  testCashinForBuyer,
  deuroCashinForBuyer,
  getDeuroBalance,
} = require("./tokenController");

const registerArtist = async (name, email, password) => {
  const user = await db.user
    .findOne({ email, type: userTypeList.artist })
    .exec();
  if (user?.email !== undefined) {
    throw new Error("Error: user email already exists..");
  }
  const salt = bcrypt.genSaltSync(10);
  const hash = bcrypt.hashSync(password, salt);

  try {
    const newUser = {
      email,
      name,
      password: hash,
      type: userTypeList.artist,
    };
    return db.user.create(newUser);
  } catch (error) {
    throw error;
  }
};

const loginArtist = async (email, password) => {
  let user = await db.user.findOne({ email }).exec();
  console.log({ user });
  if (!user) {
    throw new Error("Error: user not found");
  }
  const isPasswordValid = bcrypt.compareSync(password, user.password); // true

  if (isPasswordValid === false) {
    throw new Error("Error: password is wrong ");
  }

  const token = genToken(user);
  return { ...user?._doc, token };
};

const modifyArtist = async (_id, name, email, password, filename) => {
  const user = await db.user.findOne({ _id }).exec();
  console.log("edit this user::::", user);
  if (user?.email === undefined) {
    throw new Error("Error: user email doesn't exists..");
  }

  const token = genToken(user);
  const pic_id = filename ? filename : user?.pic_id;
  try {
    if (password !== "no_pass") {
      const salt = bcrypt.genSaltSync(10);
      const hash = bcrypt.hashSync(password, salt);
      const newUser = {
        email,
        name,
        password: hash,
        pic_id,
      };
      const mongoUser = await db.user
        .findOneAndUpdate({ _id }, newUser, { new: true })
        .exec();
      return { ...mongoUser?._doc, token };
    } else {
      const newUser = {
        email,
        name,
        pic_id,
      };
      const mongoUser = await db.user
        .findOneAndUpdate({ _id }, newUser, { new: true })
        .exec();
      return { ...mongoUser?._doc, token };
    }
  } catch (error) {
    throw error;
  }
};

const addCollectionsWeb = async (userId, collections, wallet_address) => {
  try {
    let user = await db.user.findById(userId).exec();
    if (!user) {
      throw new Error({ status: 500, message: "user not found" });
    }
    user.collections = [...new Set([...user.collections, ...collections])];
    if (!user.wallet_addresses.includes(wallet_address)) {
      user.wallet_addresses.push(wallet_address);
    }

    const token = genToken(user);

    try {
      user = await db.user.findOneAndUpdate(
        { _id: user._id },
        {
          collections: user.collections,
          wallet_addresses: user.wallet_addresses,
        },
        { returnOriginal: false }
      );
      return { ...user?._doc, token };
    } catch (error) {
      throw error;
    }
  } catch (error) {
    throw error;
  }
};

const deleteCollectionsWeb = async (userId, collections) => {
  try {
    let user = await db.user.findById(userId).exec();
    if (!user) {
      throw new Error({ status: 500, message: "user not found" });
    }
    user.collections = user.collections.filter((el) => {
      return collections.indexOf(el) === -1;
    });

    const token = genToken(user);

    try {
      user = await db.user.findOneAndUpdate(
        { _id: user._id },
        { collections: user.collections },
        { returnOriginal: false }
      );
      return { ...user?._doc, token };
    } catch (error) {
      throw error;
    }
  } catch (error) {
    throw error;
  }
};

const registerBuyer = async (name, email, password) => {
  const user = await db.user.findOne({ email }).exec();
  if (user?.email !== undefined) {
    throw new Error("Error: user email already exists..");
  }
  const salt = bcrypt.genSaltSync(10);
  const hash = bcrypt.hashSync(password, salt);
  const walletData = await newPrivateWallet();
  // const res = await deuroCashinForBuyer(walletData.custodialAddress, 0.1);
  // console.log("result after mint", res);
  try {
    const newUser = {
      email,
      name,
      password: hash,
      ...walletData,
    };
    return db.user.create(newUser);
  } catch (error) {
    throw error;
  }
};

const loginBuyer = async (email, password) => {
  let user = await db.user.findOne({ email }).exec();
  if (!user) {
    throw new Error("Error: user not found");
  }
  const isPasswordValid = bcrypt.compareSync(password, user.password); // true

  if (isPasswordValid === false) {
    throw new Error("Error: password is wrong ");
  }

  const token = genToken(user);

  const myBalance = await getDeuroBalance(user.custodialAddress);
  const deuro_balance = myBalance / 10 ** 18;
  const mongoUser = await db.user
    .findOneAndUpdate({ email }, { deuro_balance }, { new: true })
    .exec();
  return { ...mongoUser?._doc, token };
};

const modifyBuyer = async (_id, name) => {
  const user = await db.user.findOne({ _id }).exec();
  console.log("edit this user::::", user);
  if (user?.email === undefined) {
    throw new Error("Error: user doesn't exists..");
  }
  const token = genToken(user);

  try {
    const newUser = {
      name,
    };
    const mongoUser = await db.user
      .findOneAndUpdate({ _id }, newUser, { new: true })
      .exec();

    return { ...mongoUser?._doc, token };
  } catch (error) {
    throw error;
  }
};

const getAllArtists = async () => {
  try {
    const users = await db.user.find({ type: userTypeList.artist }).exec();
    return users;
  } catch (error) {
    throw error;
  }
};

const filterAssets = (allAssetsParam, collectionsParam) => {
  return allAssetsParam.filter(
    (asset) =>
      collectionsParam.includes(asset.collection.slug) &&
      asset.seaport_sell_orders !== null
  );
};

const addPriceToEveryAsset = async (allAssetsParam) => {
  const ethPriceWithEuro = await axios
    .get("https://api.coinbase.com/v2/exchange-rates?currency=ETH")
    .then((response) => response.data)
    .then((res) => {
      return res.data.rates.EUR;
    });

  return allAssetsParam.map((asset) => {
    if (!asset.seaport_sell_orders) {
      return asset;
    }
    const priceOpensea =
      asset.seaport_sell_orders[0].current_price * Math.pow(10, -18);
    const priceEuro = priceOpensea * ethPriceWithEuro;
    const myPrice = `Prix ${priceEuro.toFixed(4)}€ / ${priceOpensea.toFixed(
      4
    )} ETH`;
    return { ...asset, myPrice };
  });
};

const getArtistAssets = async (artist, include_orders) => {
  const { collections, wallet_addresses } = artist;
  let allAssets = [];
  let promises = [];
  const options = {
    method: "GET",
    headers: {
      Accept: "application/json",
      "X-API-KEY": "5bec8ae0372044cab1bef0d866c98618",
    },
  };
  if (wallet_addresses?.length > 0) {
    for (const address of wallet_addresses) {
      promises.push(
        new Promise((resolve, reject) => {
          axios
            .get(
              `${process.env.OPENSEA_API_TESTNET}/assets?owner=${address}&limit=50&include_orders=${include_orders}`,
              options
            )
            .then((response) => response.data)
            .then((data) => {
              console.log({ data }, { address });
              resolve(data.assets);
            })
            .catch((err) => {
              console.log({ err });
              reject(err);
            });
        })
      );
    }
    allAssets = await Promise.all(promises)
      .then((assetsArrays) => assetsArrays.flat())
      .finally((assetsArrays) => assetsArrays)
      .catch((err) => console.log({ err }));

    if (allAssets?.length > 0) {
      const filteredAssets = filterAssets(allAssets, collections);
      return addPriceToEveryAsset(filteredAssets);
    }
  }
};

const getBuyerAssets = async (artist, include_orders) => {
  const { collections, wallet_addresses } = artist;
  let allAssets = [];
  let promises = [];
  const options = {
    method: "GET",
    headers: {
      Accept: "application/json",
      "X-API-KEY": "5bec8ae0372044cab1bef0d866c98618",
    },
  };
  if (wallet_addresses?.length > 0) {
    for (const address of wallet_addresses) {
      promises.push(
        new Promise((resolve, reject) => {
          axios
            .get(
              `https://testnets-api.opensea.io/api/v1/assets?owner=${address}&limit=50&include_orders=${include_orders}`,
              options
            )
            .then((response) => response.data)
            .then((data) => {
              console.log({ data }, { address });
              resolve(data.assets);
            })
            .catch((err) => {
              console.log({ err });
              reject(err);
            });
        })
      );
    }
    allAssets = await Promise.all(promises)
      .then((assetsArrays) => assetsArrays.flat())
      .finally((assetsArrays) => assetsArrays)
      .catch((err) => console.log({ err }));

    if (allAssets?.length > 0) {
      const filteredAssets = filterAssets(allAssets, collections);
      return addPriceToEveryAsset(filteredAssets);
    }
  }
};

module.exports = {
  registerArtist,
  loginArtist,
  modifyArtist,
  addCollectionsWeb,
  deleteCollectionsWeb,
  registerBuyer,
  loginBuyer,
  modifyBuyer,
  getAllArtists,
  getArtistAssets,
  getBuyerAssets,
};

// const addUser = async (user) => {
//   const newUser = await db.user.create(user);
//   return newUser;
// };

// const register = async (name, email, password) => {
//   try {
//     response = await axios.post(process.env.DEVENTURL + "/signup/consumer", {
//       password: password,
//       name: name,
//       email: email,
//     });
//   } catch (error) {
//     throw error;
//   }
// };

// const login = async (email, password) => {
//   let response = await axios.post(process.env.DEVENTURL + "/login/user", {
//     password: password,
//     email: email,
//   });
//   if (response.data.status == "error") {
//     throw { status: 500, message: response.data.message };
//   } else {
//     const deventUser = response.data.data;

//     let user = await db.user.findOne({ deventId: deventUser.id });
//     if (!user) {
//       const newUser = { deventId: deventUser.id, email: deventUser.email };
//       user = await db.user.create(newUser);
//     }

//     const headers = {
//       Authorization: deventUser.token,
//     };

//     response = await axios.get(process.env.DEVENTURL + "/wallet", {
//       headers: headers,
//     });
//     if (response.data.status == "error") {
//       throw { status: 500, message: response.data.message };
//     } else {
//       const deuro_wallet = response.data.data;
//       return { user: { ...deventUser, mongoUser: user._doc }, deuro_wallet };
//     }
//   }
// };

// const editUsername = async (token, name) => {
//   console.log({ token });
//   try {
//     response = await axios.post(
//       process.env.DEVENTURL + "/edit/user",
//       {
//         name,
//       },
//       { headers: { Authorization: token } }
//     );
//   } catch (error) {
//     throw error;
//   }
// };

// const getUser = async (id, token) => {
//   let user = await db.user.findById(id);

//   if (!user) {
//     throw { status: 500, message: "user not found" };
//   }
//   const headers = {
//     Authorization: token,
//   };

//   try {
//     const response = await axios.post(
//       process.env.DEVENTURL + "/find/user",
//       {
//         email: user.email,
//       },
//       {
//         headers: headers,
//       }
//     );
//     if (response.data.status == "error") {
//       throw { status: 500, message: response.data.message };
//     }
//     return (user = { ...user, ...response.data.data });
//   } catch (error) {
//     throw error;
//   }
// };

// const getUserById = async (id) => {
//   let user = await db.user.findById(id);

//   if (!user) {
//     throw { status: 500, message: "user not found" };
//   }
//   return user;
// };

// const getAllCollections = async () => {
//   const users = await db.user.find();
//   let collections = [];
//   users.map((user) => (collections = [...user.collections]));
//   return collections;
// };
