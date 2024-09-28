const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

mongoose.connect("mongodb://mongodb:27017/eventdb", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// Modelos
const EventSchema = new mongoose.Schema({
  capacity: Number,
  areas: [
    { id: Number, name: String, capacity: Number, currentOccupancy: Number },
  ],
  entrances: [{ id: Number, name: String, count: Number }],
  controlPoints: [{ id: Number, name: String, count: Number }],
  routes: [
    { id: Number, entrance: Number, controlPoint: Number, area: Number },
  ],
  totalOccupancy: Number,
});

const Event = mongoose.model("Event", EventSchema);

// Rutas para configuración del evento (admin)
app.post("/event/setup", async (req, res) => {
  const { capacity, areas, entrances, controlPoints, routes } = req.body;
  try {
    const event = new Event({
      capacity,
      areas: areas.map((area) => ({ ...area, currentOccupancy: 0 })),
      entrances: entrances.map((entrance) => ({ ...entrance, count: 0 })),
      controlPoints: controlPoints.map((cp) => ({ ...cp, count: 0 })),
      routes,
      totalOccupancy: 0,
    });
    await event.save();
    res.status(201).json(event);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

app.get("/event", async (req, res) => {
  try {
    const event = await Event.findOne();
    res.json(event);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Ruta para actualizar aforo (staff)
app.post("/event/update-occupancy", async (req, res) => {
  const { ticketId, location, locationType } = req.body;
  try {
    const event = await Event.findOne();
    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }

    let updateField;
    switch (locationType) {
      case "entrance":
        updateField = "entrances";
        break;
      case "controlPoint":
        updateField = "controlPoints";
        break;
      case "area":
        updateField = "areas";
        break;
      default:
        return res.status(400).json({ message: "Invalid location type" });
    }

    const locationIndex = event[updateField].findIndex(
      (item) => item.id === location
    );
    if (locationIndex === -1) {
      return res.status(404).json({ message: "Location not found" });
    }

    event[updateField][locationIndex].count += 1;
    if (locationType === "area") {
      event[updateField][locationIndex].currentOccupancy += 1;
      event.totalOccupancy += 1;
    }

    await event.save();
    res.json(event);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Ruta para obtener estadísticas de aforo
app.get("/event/stats", async (req, res) => {
  try {
    const event = await Event.findOne();
    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }

    const stats = {
      totalCapacity: event.capacity,
      totalOccupancy: event.totalOccupancy,
      occupancyRate: (event.totalOccupancy / event.capacity) * 100,
      areaStats: event.areas.map((area) => ({
        name: area.name,
        capacity: area.capacity,
        currentOccupancy: area.currentOccupancy,
        occupancyRate: (area.currentOccupancy / area.capacity) * 100,
      })),
      entranceStats: event.entrances.map((entrance) => ({
        name: entrance.name,
        count: entrance.count,
      })),
      controlPointStats: event.controlPoints.map((cp) => ({
        name: cp.name,
        count: cp.count,
      })),
    };

    res.json(stats);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

const PORT = process.env.PORT || 3003;
app.listen(PORT, () =>
  console.log(`Servicio de Gestión de Aforo ejecutándose en el puerto ${PORT}`)
);
