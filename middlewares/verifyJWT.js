const jwt = require("jsonwebtoken");

const authenticateJWT = (req, res, next) => {
  let tokenHeaderKey = process.env.TOKEN_HEADER_KEY;
  let jwtSecretKey = process.env.JWT_SECRET_KEY;
  const authHeader = req.header(tokenHeaderKey);
  if (authHeader) {
    // const token = jwtSecretKey.split(' ')[1];

    jwt.verify(authHeader, jwtSecretKey, (err, user) => {
      if (err) {
        return res.sendStatus(403);
      }
      req.user = user;
      next();
    });
  } else {
    res.sendStatus(401);
  }
};

module.exports = {
  authenticateJWT,
};
