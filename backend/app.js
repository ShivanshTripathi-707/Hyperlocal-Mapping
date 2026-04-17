const express = require("express");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const cors = require("cors");

const app = express();
const PORT = 5000;
const MONGO_URI = "mongodb+srv://shivanshtripathi712_db_user:cigMup5An1uvZxf1@cluster0.zmza5ep.mongodb.net/";

// ─── Middleware ───────────────────────────────────────────────────────────────
app.use(cors());
app.use(express.json());

// ─── MongoDB Connection ───────────────────────────────────────────────────────
mongoose
  .connect(MONGO_URI)
  .then(() => console.log("✅ MongoDB connected successfully"))
  .catch((err) => console.error("❌ MongoDB connection error:", err));

// ─── User Schema & Model ──────────────────────────────────────────────────────
const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
    },
    contactNumber: {
      type: String,
      required: [true, "Contact number is required"],
      trim: true,
    },
    location: {
      type: String,
      required: [true, "Location is required"],
      trim: true,
    },
    password: {
      type: String,
      required: [true, "Password is required"],
    },
  },
  { timestamps: true }
);

const User = mongoose.model("User", userSchema);

// ─── Post Schema & Model ──────────────────────────────────────────────────────
const postSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    userName: {
      type: String,
      required: true,
    },
    problem: {
      type: String,
      required: [true, "Problem description is required"],
      trim: true,
    },
    solution: {
      type: String,
      required: [true, "Solution is required"],
      trim: true,
    },
    areaName: {
      type: String,
      required: [true, "Area name is required"],
      trim: true,
    },
    areaCoordinates: {
      lat: { type: Number },
      lng: { type: Number },
    },
  },
  { timestamps: true }
);

const Post = mongoose.model("Post", postSchema);

// ─── Auth Middleware ──────────────────────────────────────────────────────────
const authMiddleware = async (req, res, next) => {
  try {
    const userId = req.headers["x-user-id"];
    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized: No user ID provided" });
    }
    const user = await User.findById(userId);
    if (!user) {
      return res.status(401).json({ success: false, message: "Unauthorized: User not found" });
    }
    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ success: false, message: "Unauthorized: Invalid user ID" });
  }
};

// ─── Routes ───────────────────────────────────────────────────────────────────

// Health check
app.get("/", (req, res) => {
  res.json({ success: true, message: "🗺️ Realtime Community Hyperlocal Mapping API is running" });
});

// ── Auth Routes ───────────────────────────────────────────────────────────────

// SIGNUP
app.post("/api/auth/signup", async (req, res) => {
  try {
    const { name, email, contactNumber, location, password } = req.body;

    // Validate all fields
    if (!name || !email || !contactNumber || !location || !password) {
      return res.status(400).json({ success: false, message: "All fields are required" });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({ success: false, message: "User with this email already exists" });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create new user
    const user = new User({
      name,
      email,
      contactNumber,
      location,
      password: hashedPassword,
    });

    await user.save();

    res.status(201).json({
      success: true,
      message: "Account created successfully",
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        contactNumber: user.contactNumber,
        location: user.location,
      },
    });
  } catch (err) {
    console.error("Signup error:", err);
    res.status(500).json({ success: false, message: "Server error during signup" });
  }
});

// LOGIN
app.post("/api/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: "Email and password are required" });
    }

    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ success: false, message: "Invalid email or password" });
    }

    // Check password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: "Invalid email or password" });
    }

    res.status(200).json({
      success: true,
      message: "Login successful",
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        contactNumber: user.contactNumber,
        location: user.location,
      },
    });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ success: false, message: "Server error during login" });
  }
});

// ── Post Routes ───────────────────────────────────────────────────────────────

// CREATE POST (protected)
app.post("/api/posts", authMiddleware, async (req, res) => {
  try {
    const { problem, solution, areaName, areaCoordinates } = req.body;

    if (!problem || !solution || !areaName) {
      return res.status(400).json({ success: false, message: "Problem, solution, and area name are required" });
    }

    const post = new Post({
      userId: req.user._id,
      userName: req.user.name,
      problem,
      solution,
      areaName,
      areaCoordinates: areaCoordinates || null,
    });

    await post.save();

    res.status(201).json({
      success: true,
      message: "Post created successfully",
      post,
    });
  } catch (err) {
    console.error("Create post error:", err);
    res.status(500).json({ success: false, message: "Server error while creating post" });
  }
});

// GET ALL POSTS (protected)
app.get("/api/posts", authMiddleware, async (req, res) => {
  try {
    const posts = await Post.find().sort({ createdAt: -1 });
    res.status(200).json({ success: true, posts });
  } catch (err) {
    console.error("Fetch posts error:", err);
    res.status(500).json({ success: false, message: "Server error while fetching posts" });
  }
});

// GET SINGLE POST
app.get("/api/posts/:id", authMiddleware, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ success: false, message: "Post not found" });
    }
    res.status(200).json({ success: true, post });
  } catch (err) {
    console.error("Fetch post error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// ─── Start Server ─────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});