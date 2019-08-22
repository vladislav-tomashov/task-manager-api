const express = require("express");
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
    const task = await Task.findByOne({ _id, owner: user._id });
    if (!task) {
      return res.status(404).send();
    }
    res.send(task);
  } catch (e) {
    res.status(500).send(e);
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
    // const tasks = await Task.find({ owner: user._id });
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

module.exports = router;
