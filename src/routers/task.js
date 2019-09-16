const express = require("express");
const multer = require("multer");
const sharp = require("sharp");
const Task = require("../models/task");
const auth = require("../middleware/auth");

const router = express.Router();

router.post("/tasks", auth, async (req, res) => {
  try {
    const task = new Task({ ...req.body, owner: req.user._id });
    await task.save();
    res.status(201).send(task);
  } catch (e) {
    res.status(400).send(e);
  }
});

router.get("/tasks/:id", auth, async (req, res) => {
  try {
    const { user } = req;
    const { id: _id } = req.params;
    const task = await Task.findOne({ _id, owner: user._id });
    if (!task) {
      return res.status(404).send();
    }
    res.send(task);
  } catch (e) {
    res.status(500).send(e);
  }
});

router.get("/tasks/:id/images", auth, async (req, res) => {
  try {
    const { user } = req;
    const { id: _id } = req.params;
    const task = await Task.findOne({ _id, owner: user._id });
    if (!task) {
      return res.status(404).send();
    }
    res.send(task.images);
  } catch (e) {
    res.status(500).send(e.message);
  }
});

router.get("/tasks", auth, async (req, res) => {
  const match = {};
  const { comleted, limit, skip } = req.query;
  if (comleted) {
    match.comleted = comleted === "true";
  }
  try {
    const { user } = req;
    await user
      .populate({
        path: "tasks",
        match,
        options: {
          limit: parseInt(limit),
          skip: parseInt(skip),
          sort: {
            createdAt: -1
          }
        }
      })
      .execPopulate();
    res.send(user.tasks);
  } catch (e) {
    res.status(500).send(e);
  }
});

router.patch("/tasks/:id", auth, async (req, res) => {
  updates = Object.keys(req.body);
  const allowedUpdates = ["description", "completed"];
  const isValidOperation = updates.every(update =>
    allowedUpdates.includes(update)
  );
  if (!isValidOperation) {
    return res.status(400).send({ error: "Invalid updates!" });
  }
  try {
    const { id: taskId } = req.params;
    const { user } = req;
    const task = await Task.findOne({ _id: taskId, owner: user._id });
    if (!task) {
      return res.status(404).send();
    }
    updates.forEach(update => (task[update] = req.body[update]));
    await task.save();
    res.send(task);
  } catch (e) {
    res.status(400).send(e);
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
  "/tasks/:id/images",
  auth,
  upload.array("images"),
  async (req, res) => {
    try {
      const { id: taskId } = req.params;
      const { user } = req;
      const task = await Task.findOne({ _id: taskId, owner: user._id });
      if (!task) {
        return res.status(404).send();
      }
      const images = [];
      for (const file of req.files) {
        const image = await sharp(file.buffer)
          .png()
          .toBuffer();
        images.push({ image });
      }
      task.images = images;
      await task.save();
      res.send();
    } catch (e) {
      res.status(400).send({ error: e.message });
    }
  }
);

module.exports = router;
