const express = require("express");
const router = express.Router();
const {
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
} = require("../services/user");

const multer = require("multer");
const { authenticateJWT } = require("../middlewares/verifyJWT");
let storage = multer.diskStorage({
  destination: "uploads/",
  // filename: function (req, file, callback) {
  //   callback(null, file.originalname);
  // },
});
let upload = multer({ storage: storage });

router.post("/registerArtist", async (req, res, next) => {
  const { name, email, password } = req.body;

  try {
    const result = await registerArtist(name, email, password);
    console.log({ result });
    res.send(result);
  } catch (error) {
    res.status(500).send(error.message);
  }
});

router.post("/loginArtist", async (req, res, next) => {
  const { email, password } = req.body;

  try {
    const result = await loginArtist(email, password);
    console.log(result);
    res.send(result);
  } catch (error) {
    res.status(500).send(error.message);
  }
});

router.post(
  "/modifyArtist",
  authenticateJWT,
  upload.single("image"),
  async (req, res, next) => {
    // req.file is the `avatar` file
    // req.body will hold the text fields, if there were any
    console.log(req.file, req.body);
    let filename;
    const { _id, name, email, password } = req.body;
    if (req.file !== undefined) {
      filename = req.file.filename;
      console.log({ file: req.file });
    }
    try {
      const result = await modifyArtist(_id, name, email, password, filename);
      console.log({ result });
      res.send(result);
    } catch (error) {
      res.status(500).send(error.message);
    }
  }
);

router.patch("/addCollections", authenticateJWT, async (req, res, next) => {
  const { userId, collections, wallet_address } = req.body;

  try {
    const result = await addCollectionsWeb(userId, collections, wallet_address);
    res.send(result);
  } catch (error) {
    res.status(500).send(error.message);
  }
});

router.patch("/deleteCollections", authenticateJWT, async (req, res, next) => {
  const { userId, collections } = req.body;

  try {
    const result = await deleteCollectionsWeb(userId, collections);
    res.send(result);
  } catch (error) {
    res.status(500).send(error.message);
  }
});

router.post("/registerBuyer", async (req, res, next) => {
  const { email, password, name } = req.body;

  try {
    const result = await registerBuyer(name, email, password);
    res.send(result);
  } catch (error) {
    res.status(500).send(error.message);
  }
});

router.post("/loginBuyer", async (req, res, next) => {
  const { email, password } = req.body;

  try {
    const result = await loginBuyer(email, password);
    res.send(result);
  } catch (error) {
    res.status(500).send(error.message);
  }
});

router.post("/modifyBuyer", authenticateJWT, async (req, res, next) => {
  const { _id, name } = req.body;
  let filename;
  if (req.file !== undefined) {
    filename = req.file.filename;
    console.log({ file: req.file });
  }
  try {
    const result = await modifyBuyer(_id, name);
    res.send(result);
  } catch (error) {
    res.status(500).send(error.message);
  }
});

router.get("/", authenticateJWT, async (req, res, next) => {
  try {
    const result = await getAllArtists();
    res.send(result);
  } catch (error) {
    res.status(500).send(error.message);
  }
});

router.post("/getArtistAssets", authenticateJWT, async (req, res, next) => {
  const { artist, include_orders } = req.body;

  try {
    const result = await getArtistAssets(artist, include_orders);
    res.send(result);
  } catch (error) {
    res.send(error.message);
  }
});

module.exports = router;

// router.post("/", async (req, res, next) => {
//   const { user } = req.body;

//   try {
//     const result = await addUser(user);
//     res.send(result);
//   } catch (error) {
//     res.send(error.message);
//   }
// });

// router.get("/getById/:id", async (req, res, next) => {
//   const { id } = req.params;

//   try {
//     const result = await getUserById(id);
//     res.send(result);
//   } catch (error) {
//     res.status(error.status);
//     res.send(error.message);
//   }
// });

// router.get("/:id", async (req, res, next) => {
//   const { id } = req.params;
//   const { token } = req.query;

//   try {
//     const result = await getUser(id, token);
//     res.send(result);
//   } catch (error) {
//     res.status(error.status);
//     res.send(error.message);
//   }
// });

// router.post("/editUsername", async (req, res, next) => {
//   const { token, name } = req.body;

//   try {
//     const result = await editUsername(token, name);
//     res.send(result);
//   } catch (error) {
//     // res.status(error.status);
//     res.send(error.message);
//   }
// });

// router.get("/allCollections", async (req, res, next) => {
//   try {
//     const result = await getAllCollections();
//     res.send(result);
//   } catch (error) {
//     res.status(500).send(error.message);
//   }
// });
