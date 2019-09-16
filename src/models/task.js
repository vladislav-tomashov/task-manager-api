const mongoose = require("mongoose");

const schema = new mongoose.Schema(
  {
    description: { type: String, trim: true, required: true },
    completed: { type: Boolean, default: false },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "User"
    },
    images: [
      {
        image: {
          type: Buffer
        }
      }
    ]
  },
  { timestamps: true }
);

schema.methods.toJSON = function() {
  const task = this;
  const taskObject = task.toObject();
  delete taskObject.images;
  return taskObject;
};

const Task = mongoose.model("Task", schema);

module.exports = Task;
