const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const app = express();

mongoose.connect("mongodb://mongodb:27017/ticketdb", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const TicketSchema = new mongoose.Schema({
  id: String,
  userId: Number,
  eventName: String,
  date: String,
  time: String,
  area: String,
  seat: String,
  price: Number,
  status: String,
  entrance: String,
});

const Ticket = mongoose.model("Ticket", TicketSchema);

app.use(cors());
app.use(express.json());

app.post("/validate-ticket", async (req, res) => {
  const { qrData, staffArea } = req.body;

  try {
    const ticketInfo = JSON.parse(qrData);
    const ticket = await Ticket.findOne({ id: ticketInfo.id });

    if (!ticket) {
      return res.status(404).json({
        isValid: false,
        message: "Ticket not found in the database",
        ticketInfo: null,
      });
    }

    const isValid = ticket.status === "valid";
    const isCorrectArea = ticket.area === staffArea;

    let message = "";
    if (!isValid) {
      message = "This ticket is not valid.";
    } else if (!isCorrectArea) {
      message = `This ticket is for ${ticket.area}. Please direct the user to the correct entrance.`;
    } else {
      message = "Ticket is valid and for the correct area.";
    }

    res.json({
      isValid,
      isCorrectArea,
      message,
      ticketInfo: {
        id: ticket.id,
        eventName: ticket.eventName,
        date: ticket.date,
        time: ticket.time,
        area: ticket.area,
        seat: ticket.seat,
        status: ticket.status,
        entrance: ticket.entrance,
      },
    });
  } catch (error) {
    console.error("Error validating ticket:", error);
    res.status(400).json({
      isValid: false,
      message: "Invalid QR code data",
      ticketInfo: null,
    });
  }
});

// Ruta para inicializar algunos tickets de prueba
app.post("/init-tickets", async (req, res) => {
  const initialTickets = [
    {
      id: "T001",
      userId: 4,
      eventName: "Summer Music Festival",
      date: "2024-07-15",
      time: "18:00",
      area: "Main Stage - General",
      seat: "GA-001",
      price: 50.0,
      status: "valid",
      entrance: "Main Entrance - General",
    },
    // Añade más tickets de prueba aquí
  ];

  try {
    await Ticket.deleteMany({}); // Limpiar tickets existentes
    await Ticket.insertMany(initialTickets);
    res.json({ message: "Tickets initialized successfully" });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error initializing tickets", error: error.message });
  }
});

const PORT = process.env.PORT || 3002;
app.listen(PORT, () =>
  console.log(
    `Servicio de Validación de Boletas ejecutándose en el puerto ${PORT}`
  )
);
