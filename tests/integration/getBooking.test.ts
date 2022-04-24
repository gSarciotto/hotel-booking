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

describe("GET /booking should", () => {
    let server: ReturnType<typeof startServer>;
    let request: ReturnType<typeof supertest.agent>;
    let container: StartedPostgreSqlContainer;
    let db: Knex;
    const existingRoom: Room = {
        id: 10,
        name: "some room name"
    };
    const existingBookings: Booking[] = [
        {
            id: v4(),
            roomId: existingRoom.id,
            bookingDate: new Date("1995-12-16T01:00:00.000+02:00"),
            email: "email_1@email.com",
            isConfirmed: false
        },
        {
            id: v4(),
            roomId: existingRoom.id,
            bookingDate: new Date("1995-12-18T12:00:00.000+02:00"),
            email: "email_1@email.com",
            isConfirmed: true
        },
        {
            id: v4(),
            roomId: existingRoom.id,
            bookingDate: new Date("1995-12-20T12:00:00.000+02:00"),
            email: "email_2@email.com",
            isConfirmed: true
        }
    ];

    beforeAll(async () => {
        container = await new PostgreSqlContainer()
            .withDatabase("get_booking_test") // maybe randomize this
            .start();
        db = await startDatabase({
            host: container.getHost(),
            port: container.getPort(),
            database: container.getDatabase(),
            user: container.getUsername(),
            password: container.getPassword()
        });
        await db("rooms").insert(existingRoom);
        await db("bookings").insert(existingBookings);
        server = startServer(db, 3300);
        request = supertest.agent(server);
    });

    afterAll(async () => {
        server?.close();
        await db?.destroy();
        await container?.stop();
    });

    it("return all existing bookings", async () => {
        const expectedBookings = existingBookings.map((booking) => ({
            ...booking,
            bookingDate: booking.bookingDate.getTime()
        }));
        const response = await request.get("/booking");
        expect(response.status).toBe(200);
        const returnedBookings = (response.body as { bookings: Booking[] })
            ?.bookings;
        expect(returnedBookings).toHaveLength(expectedBookings.length);
        expect(
            returnedBookings.map((booking) => ({
                ...booking,
                bookingDate: new Date(booking.bookingDate).getTime()
            }))
        ).toEqual(expect.arrayContaining(expectedBookings));
    });

    it("return bookings filtered by email", async () => {
        const emailToFilterBy = existingBookings[0].email;
        const expectedBookings = existingBookings
            .filter((booking) => booking.email === emailToFilterBy)
            .map((booking) => ({
                ...booking,
                bookingDate: booking.bookingDate.getTime()
            }));
        const response = await request
            .get("/booking")
            .query({ email: emailToFilterBy });
        expect(response.status).toBe(200);
        const returnedBookings = (response.body as { bookings: Booking[] })
            ?.bookings;
        expect(returnedBookings).toHaveLength(expectedBookings.length);
        expect(
            returnedBookings.map((booking) => ({
                ...booking,
                bookingDate: new Date(booking.bookingDate).getTime()
            }))
        ).toEqual(expect.arrayContaining(expectedBookings));
    });

    it("return bookings filtered by confirmation status", async () => {
        const confirmationStatusToFilterBy = true;
        const expectedBookings = existingBookings
            .filter(
                (booking) =>
                    booking.isConfirmed === confirmationStatusToFilterBy
            )
            .map((booking) => ({
                ...booking,
                bookingDate: booking.bookingDate.getTime()
            }));
        const response = await request
            .get("/booking")
            .query({ confirmed: confirmationStatusToFilterBy });
        expect(response.status).toBe(200);
        const returnedBookings = (response.body as { bookings: Booking[] })
            .bookings;
        expect(returnedBookings).toHaveLength(expectedBookings.length);
        expect(
            returnedBookings.map((booking) => ({
                ...booking,
                bookingDate: new Date(booking.bookingDate).getTime()
            }))
        ).toEqual(expect.arrayContaining(expectedBookings));
    });
});
