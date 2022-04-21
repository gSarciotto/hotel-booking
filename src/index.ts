import express from "express";

const app = express();

app.get("/", (req, res) => {
    console.log("hello world");
    res.status(200).send("hello world");
});

app.listen(3000, () => {
    console.log("server started");
});
