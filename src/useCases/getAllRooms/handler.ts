import { RequestHandler } from "express";
import { Knex } from "knex";
import { getAllRooms } from "./queries";

export default function createGetRoomsHandler(db: Knex): RequestHandler {
    return (_, res) => {
        getAllRooms(db)
            .then((rooms) => {
                res.status(200).json({ rooms });
            })
            .catch((err) => {
                console.error(err);
                res.status(500).json({ message: "Unable to get rooms" });
            });
    };
}
