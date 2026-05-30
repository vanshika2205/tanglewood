const jwt = require("jsonwebtoken");

function verifyToken(req, res, next) {

  const token = req.headers["authorization"];

  if (!token) {
    return res.status(403).json({
      message: "Token required"
    });
  }

  try {

    const decoded = jwt.verify(token, "mySecretKey");

    req.userId = decoded.userId;

    next();

  } catch (error) {

    res.status(401).json({
      message: "Invalid token"
    });

  }

}

module.exports = verifyToken;