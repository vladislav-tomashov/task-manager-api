const express = require("express");
const multer = require("multer");
const sharp = require("sharp");
const auth = require("../middleware/auth");
const User = require("../models/user");
const { sendWelcomeEmail } = require("../emails/account");

const router = express.Router();

router.post("/users", async (req, res) => {
  try {
    const user = new User(req.body);
    await user.save();
    sendWelcomeEmail(user.email, user.name);
    const token = await user.generateAuthToken();
    res.status(201).send({ user, token });
  } catch (e) {
    res.status(400).send(e.toString());
  }
});

router.post("/users/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findByCredentials(email, password);
    const token = await user.generateAuthToken();
    res.send({ user, token });
  } catch (e) {
    res.status(400).send();
  }
});

router.post("/users/logout", auth, async (req, res) => {
  try {
    const { user, token } = req;
    user.tokens = await user.tokens.filter(token2 => token2.token != token);
    await user.save();
    res.send();
  } catch (e) {
    res.status(400).send();
  }
});

router.post("/users/logoutAll", auth, async (req, res) => {
  try {
    const { user } = req;
    user.tokens = [];
    await user.save();
    res.send();
  } catch (e) {
    res.status(400).send();
  }
});

router.get("/users/me", auth, async (req, res) => {
  res.send(req.user);
});

router.patch("/users/me", auth, async (req, res) => {
  updates = Object.keys(req.body);
  const allowedUpdates = ["name", "email", "password", "age"];
  const isValidOperation = updates.every(update =>
    allowedUpdates.includes(update)
  );
  if (!isValidOperation) {
    return res.status(400).send({ error: "Invalid updates!" });
  }
  try {
    const { user } = req;
    updates.forEach(update => (user[update] = req.body[update]));
    await user.save();
    res.send(user);
  } catch (e) {
    res.status(400).send(e.toString());
  }
});

const upload = multer({
  limits: {
    fileSize: 1000000
  },
  fileFilter(req, file, cb) {
    if (!file.originalname.match(/\.(jpg|jpeg|png)$/)) {
      return cb(new Error("Please upload an image"));
    }
    cb(undefined, true);
  }
});

router.post(
  "/users/me/avatar",
  auth,
  upload.single("avatar"),
  async (req, res) => {
    const buffer = await sharp(req.file.buffer)
      .resize({ width: 250, height: 250 })
      .png()
      .toBuffer();

    try {
      const { user } = req;
      user.avatar = buffer;
      await user.save();
      res.send();
    } catch (e) {
      res.status(400).send({ error: e.message });
    }
  }
);

router.delete("/users/me/avatar", auth, async (req, res) => {
  try {
    const { user } = req;
    user.avatar = undefined;
    await user.save();
    res.send();
  } catch (e) {
    res.status(400).send({ error: e.message });
  }
});

router.get("/users/:id/avatar", async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      throw new Error();
    }
    res.set("Content-Type", "image/png").send(user.avatar);
  } catch (e) {
    res.status(400).send({ error: e.message });
  }
});

router.delete("/users/me", auth, async (req, res) => {
  try {
    const { user } = req;
    await user.remove();
    res.send(user);
  } catch (e) {
    res.status(500).send(e.toString());
  }
});

module.exports = router;
