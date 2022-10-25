const jwt = require("jsonwebtoken");

const genToken = (user) => {
  let jwtSecretKey = process.env.JWT_SECRET_KEY;
  let data = {
    time: new Date(),
    userId: user._id,
  };
  const token = jwt.sign(data, jwtSecretKey);
  return token;
};

module.exports = {
  genToken,
};
