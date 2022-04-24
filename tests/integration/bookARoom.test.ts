import { Knex } from "knex";
import {
    PostgreSqlContainer,
    StartedPostgreSqlContainer
} from "testcontainers";
import supertest from "supertest";
import { startServer } from "../../src/app";
import { startDatabase } from "../../src/database/database";
import { Room } from "../../src/database/models/room";
import { Booking } from "../../src/database/models/booking";
import { v4 } from "uuid";

describe("POST /booking should", () => {
    let server: ReturnType<typeof startServer>;
    let request: ReturnType<typeof supertest.agent>;
    let container: StartedPostgreSqlContainer;
    let db: Knex;
    const existingRoom: Room = {
        id: 10,
        name: "some room name"
    };

    beforeAll(async () => {
        container = await new PostgreSqlContainer()
            .withDatabase("book_a_room_test") // maybe randomize this
            .start();
        db = await startDatabase({
            host: container.getHost(),
            port: container.getPort(),
            database: container.getDatabase(),
            user: container.getUsername(),
            password: container.getPassword()
        });
        await db("rooms").insert(existingRoom);
        server = startServer(db, 3200);
        request = supertest.agent(server);
    });

    beforeEach(async () => {
        await db("bookings").truncate();
    });

    afterAll(async () => {
        server?.close();
        await db?.destroy();
        await container?.stop();
    });

    it("reply with 201 when booking is successful", async () => {
        const newBooking = {
            roomId: existingRoom.id,
            email: "some_email@email.com",
            bookingDate: new Date("1995-12-16T01:00:00.000+02:00").toISOString()
        };
        console.log(newBooking.bookingDate);
        const response = await request
            .post("/booking")
            .set("Content-Type", "application/json")
            .send(newBooking);
        expect(response.status).toBe(201);
        const isResponseBodyAnEmptyObject =
            typeof response.body === "object" &&
            response.body !== null &&
            Object.keys(response.body as object).length === 0;
        expect(isResponseBodyAnEmptyObject).toBe(true);
    });

    it("save a new booking into database", async () => {
        const newBooking = {
            roomId: existingRoom.id,
            email: "some_email@email.com",
            bookingDate: new Date("1995-12-16T01:00:00.000+02:00").toISOString()
        };
        await request
            .post("/booking")
            .set("Content-Type", "application/json")
            .send(newBooking);

        const savedBookings = await db<Booking>("bookings").select([
            "roomId",
            "bookingDate",
            "email"
        ]);
        expect(savedBookings).toHaveLength(1);
        expect({
            email: savedBookings[0].email,
            roomId: savedBookings[0].roomId
        }).toEqual({ email: newBooking.email, roomId: newBooking.roomId });
        expect(new Date(savedBookings[0].bookingDate).getTime()).toBe(
            new Date(newBooking.bookingDate).getTime()
        );
    });

    it.skip("validate request body and return 400 if it is invalid", async () => {
        const requestWithInvalidStartingDate = {
            roomId: 123,
            email: "some_email@email.com",
            date: "this is not a date"
        };

        const response = await request
            .post("/booking")
            .set("Content-type", "application/json")
            .send(requestWithInvalidStartingDate);

        expect(response.status).toBe(400);
        const responseBody = response.body as { message: string };
        expect(responseBody.message).toBe("Invalid date");
    });
    it("dont do the booking if requested room doesnt exist", async () => {
        const bookingWithInexistentRoom = {
            roomId: 93289,
            email: "some_email@email.com",
            bookingDate: new Date("1995-12-16T01:00:00.000+02:00").toISOString()
        };
        const response = await request
            .post("/booking")
            .set("Content-Type", "application/json")
            .send(bookingWithInexistentRoom);
        expect(response.status).toBe(404);
        expect((response.body as { message: string })?.message).toBe(
            `Room ${bookingWithInexistentRoom.roomId} doesn't exist`
        );
        const savedBookings = await db("bookings").select("*");
        expect(savedBookings).toHaveLength(0);
    });
    it.skip("dont allow booking creation if room is already booked for that day", async () => {
        const bookingDate = new Date("1995-12-16T01:00:00.000+02:00");
        const existingBooking = {
            roomId: existingRoom.id,
            email: "some_email@email.com",
            bookingDate: bookingDate
        };
        await db<Booking>("bookings").insert({
            id: v4(),
            ...existingBooking
        });
        const bookingDateWithDifferentHours = new Date(
            "1995-12-15T12:00:00.000+02:00"
        );
        const bookingWithAlreadyBookedRoom = {
            roomId: existingBooking.roomId,
            email: "some_ohter_email@email.com",
            bookingDate: bookingDateWithDifferentHours.toISOString()
        };

        const response = await request
            .post("/booking")
            .set("Content-Type", "application/json")
            .send(bookingWithAlreadyBookedRoom);
        expect(response.status).toBe(400);
        expect((response.body as { message: string })?.message).toBe(
            `Room ${existingBooking.roomId} is already booked`
        );
        const savedBookings = await db<Booking>("bookings").select(["email"]);
        expect(savedBookings).toHaveLength(1);
        expect(savedBookings[0]).toEqual({ email: existingBooking.email });
    });
});
