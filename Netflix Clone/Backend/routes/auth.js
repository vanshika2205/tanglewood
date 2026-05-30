const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const router = express.Router();
const User = require("../models/user");
const verifyToken = require("../middleware/authMiddleware");

router.get("/test", (req, res) => {
  res.send("Auth route working");
});

router.get("/profile", verifyToken, async (req, res) => {

  try {

    const user = await User.findById(req.userId).select("-password");

    res.json(user);

  } catch(error){

    res.status(500).json({
      message: "Server error"
    });

  }

});


// REGISTER API
router.post("/register", async (req, res) => {

  try {

    const { email, password } = req.body;

    // check user already exists
    let user = await User.findOne({ email });

    if(user){
      return res.status(400).json({
        message: "User already exists"
      });
    }

    // hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // create user
    user = new User({
      email,
      password: hashedPassword
    });

    await user.save();

    res.status(201).json({
      message: "User registered successfully"
    });

  } catch(error){
    res.status(500).json({
      message: "Server error"
    });
  }

});

// LOGIN API
router.post("/login", async (req, res) => {

  try {

    const { email, password } = req.body;

    // check if user exists
    const user = await User.findOne({ email });

    if(!user){
      return res.status(400).json({
        message: "User not found"
      });
    }

    // compare password
    const isMatch = await bcrypt.compare(password, user.password);

    if(!isMatch){
      return res.status(400).json({
        message: "Invalid password"
      });
    }

    // create JWT token
    const token = jwt.sign(
      { userId: user._id , email: user.email},
      "mySecretKey",
      { expiresIn: "1h" }
    );

    res.json({
      message: "Login successful",
      token: token
    });

  } catch(error){
    res.status(500).json({
      message: "Server error"
    });
  }

});

module.exports = router;
