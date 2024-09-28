const express = require("express");
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
const cors = require("cors");
const app = express();

mongoose.connect("mongodb://mongodb:27017/ticketdb", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const UserSchema = new mongoose.Schema({
  id: Number,
  name: String,
  email: String,
  password: String,
  role: {
    type: String,
    enum: ["admin", "staff", "user"],
    default: "user",
  },
});

const User = mongoose.model("User", UserSchema);

app.use(cors());
app.use(express.json());

// Middleware para verificar el token JWT
const verifyToken = (req, res, next) => {
  const token = req.headers["authorization"];
  if (!token) return res.status(403).json({ message: "No token provided" });

  jwt.verify(token, "your-secret-key", (err, decoded) => {
    if (err)
      return res.status(500).json({ message: "Failed to authenticate token" });
    req.userId = decoded.userId;
    next();
  });
};

app.post("/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email, password });

    if (user) {
      const token = jwt.sign({ userId: user.id }, "your-secret-key", {
        expiresIn: "1h",
      });
      res.json({
        token,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
        },
      });
    } else {
      res.status(401).json({ message: "Invalid email or password" });
    }
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error during authentication", error: error.message });
  }
});

app.get("/user", verifyToken, async (req, res) => {
  try {
    const user = await User.findOne({ id: req.userId });
    if (!user) return res.status(404).json({ message: "User not found" });

    res.json({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error fetching user data", error: error.message });
  }
});

// Ruta para inicializar algunos usuarios de prueba
app.post("/init-users", async (req, res) => {
  const initialUsers = [
    {
      id: 1,
      name: "Admin User",
      email: "admin@example.com",
      password: "admin123",
      role: "admin",
    },
    {
      id: 2,
      name: "Control Staff - Main",
      email: "control_staff_main@example.com",
      password: "controlstaff123",
      role: "staff",
    },
    {
      id: 30,
      name: "Bob Williams",
      email: "bob@example.com",
      password: "bob123",
      role: "user",
    },
  ];

  try {
    await User.deleteMany({}); // Limpiar usuarios existentes
    await User.insertMany(initialUsers);
    res.json({ message: "Users initialized successfully" });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error initializing users", error: error.message });
  }
});

app.listen(3000, () =>
  console.log("Servicio de Autenticación ejecutándose en el puerto 3000")
);
