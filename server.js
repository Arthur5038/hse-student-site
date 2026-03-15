const path = require("path");
const express = require("express");
const mongoose = require("mongoose");

const app = express();
const PORT = process.env.PORT || 3000;
const MONGODB_URI = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/hse_student_site";

const feedbackSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true
    },
    email: {
      type: String,
      required: true,
      trim: true
    },
    phone: {
      type: String,
      default: "",
      trim: true
    },
    topic: {
      type: String,
      default: "other",
      trim: true
    },
    message: {
      type: String,
      required: true,
      trim: true
    },
    contact: {
      type: String,
      default: "email",
      trim: true
    },
    agree: {
      type: Boolean,
      required: true
    }
  },
  {
    timestamps: true
  }
);

const Feedback = mongoose.model("Feedback", feedbackSchema);

app.use(express.urlencoded({ extended: false }));
app.use(express.json());
app.use("/css", express.static(path.join(__dirname, "css")));
app.use("/js", express.static(path.join(__dirname, "js")));
app.use("/img", express.static(path.join(__dirname, "img")));

function sendPage(pageName, res) {
  res.sendFile(path.join(__dirname, pageName));
}

function mapTopicLabel(topic) {
  const labels = {
    study: "Учеба",
    project: "Проект",
    collab: "Сотрудничество",
    other: "Другое"
  };

  return labels[topic] || "Другое";
}

app.get("/", function (req, res) {
  sendPage("index.html", res);
});

app.get("/index.html", function (req, res) {
  sendPage("index.html", res);
});

app.get("/feedback.html", function (req, res) {
  sendPage("feedback.html", res);
});

app.get("/submissions.html", function (req, res) {
  sendPage("submissions.html", res);
});

app.post("/api/feedback", async function (req, res) {
  try {
    await Feedback.create({
      name: req.body.name,
      email: req.body.email,
      phone: req.body.phone || "",
      topic: req.body.topic || "other",
      message: req.body.message,
      contact: req.body.contact || "email",
      agree: req.body.agree === "yes"
    });

    res.redirect("/submissions.html?saved=1");
  } catch (error) {
    res.status(400).send("Не удалось сохранить сообщение. Проверьте заполнение формы и повторите попытку.");
  }
});

app.get("/api/submissions", async function (req, res) {
  try {
    const items = await Feedback.find().sort({ createdAt: -1 }).lean();
    const normalized = items.map(function (item) {
      return {
        id: item._id,
        name: item.name,
        email: item.email,
        phone: item.phone,
        topic: item.topic,
        topicLabel: mapTopicLabel(item.topic),
        message: item.message,
        contact: item.contact,
        createdAt: item.createdAt
      };
    });

    res.json(normalized);
  } catch (error) {
    res.status(500).json({ message: "Не удалось получить сообщения." });
  }
});

async function startServer() {
  try {
    await mongoose.connect(MONGODB_URI);
    app.listen(PORT, function () {
      console.log("Server started on http://localhost:" + PORT);
    });
  } catch (error) {
    console.error("MongoDB connection error:", error.message);
    process.exit(1);
  }
}

startServer();
