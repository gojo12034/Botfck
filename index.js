const express = require("express");

const app = express();
const port = process.env.PORT || 8888;

app.get("/", (req, res) => {
    res.send("Server is running.");
});

app.listen(port, "0.0.0.0", () => {  // Change to '0.0.0.0' to listen externally
    console.log(`Server running at http://0.0.0.0:${port}`);
});
