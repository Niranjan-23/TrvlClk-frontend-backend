const express = require("express");
const path = require("path");

const app = express();

// Serve React build
app.use(express.static(path.join(__dirname, "build")));

app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "build", "index.html"));
});

const PORT = process.env.PORT || 3000; // Ensure it's dynamic
app.listen(PORT, () => {
  console.log(`Frontend server running on port ${PORT}`);
});
