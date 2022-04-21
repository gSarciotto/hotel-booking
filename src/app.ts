import express from "express";
import { Knex } from "knex";
import createGetRoomsHandler from "./useCases/getAllRooms/handler";

export function startServer(db: Knex) {
    const app = express();

    app.get("/", (req, res) => {
        //delete
        console.log("hello world");
        res.status(200).send("hello world");
    });

    app.get("/room", createGetRoomsHandler(db));

    return app.listen(3000, () => {
        console.log("server started");
    });
}
