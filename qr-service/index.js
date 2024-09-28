const express = require("express");
const qrcode = require("qrcode");
const cors = require("cors");
const app = express();

app.use(cors());
app.use(express.json());

// Función para generar QR
const generateQR = async (data) => {
  try {
    return await qrcode.toDataURL(JSON.stringify(data));
  } catch (err) {
    console.error("Error generando QR:", err);
    throw err;
  }
};

app.post("/generate-qr", async (req, res) => {
  const ticketData = req.body;

  if (!ticketData || !ticketData.id) {
    return res.status(400).json({ error: "Datos de ticket inválidos" });
  }

  try {
    const qrCodeDataUrl = await generateQR(ticketData);
    res.json({ qrCode: qrCodeDataUrl });
  } catch (error) {
    res.status(500).json({ error: "Error generando QR" });
  }
});

app.post("/validate-qr", (req, res) => {
  const { qrData } = req.body;

  try {
    const ticketData = JSON.parse(qrData);

    // Aquí podrías añadir lógica adicional para validar el ticket
    // Por ejemplo, verificar en una base de datos si el ticket es válido

    if (ticketData.status === "valid") {
      res.json({ isValid: true, ticketData });
    } else {
      res.json({ isValid: false, message: "Ticket no válido" });
    }
  } catch (error) {
    res.status(400).json({ isValid: false, message: "QR inválido" });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () =>
  console.log(`Servicio de Gestión QR ejecutándose en el puerto ${PORT}`)
);
