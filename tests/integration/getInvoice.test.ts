import supertest from "supertest";
import {
    PostgreSqlContainer,
    StartedPostgreSqlContainer
} from "testcontainers";
import { startDatabase } from "../../src/database/database";
import { startServer } from "../../src/app";
import { Knex } from "knex";
import { Room } from "../../src/database/models/room";
import { Booking } from "../../src/database/models/booking";
import { v4 } from "uuid";
import { Invoice } from "../../src/database/models/invoice";

describe("GET /invoice should", () => {
    let server: ReturnType<typeof startServer>;
    let request: ReturnType<typeof supertest.agent>;
    let db: Knex;
    let container: StartedPostgreSqlContainer;

    beforeAll(async () => {
        container = await new PostgreSqlContainer()
            .withDatabase("getInvoice_test") // maybe randomize this
            .start();
        db = await startDatabase({
            host: container.getHost(),
            port: container.getPort(),
            database: container.getDatabase(),
            user: container.getUsername(),
            password: container.getPassword()
        });
        server = startServer(db, 3400);
        request = supertest.agent(server);
    });

    beforeEach(async () => {
        await db("invoices").delete();
        await db("bookings").delete();
        await db("rooms").delete();
    });

    afterAll(async () => {
        server?.close();
        await db?.destroy();
        await container?.stop();
    });

    it("return all invoices", async () => {
        const pricePerDay = 100;
        const existingRoom = (
            await db<Room>("rooms").insert({ name: "some_room" }).returning("*")
        )[0];
        const existingBookings = await db<Booking>("bookings")
            .insert([
                {
                    id: v4(),
                    email: "some_email@email.com",
                    roomId: existingRoom.id,
                    bookingDate: new Date("1995-12-16T01:00:00.000+02:00"),
                    isConfirmed: true
                },
                {
                    id: v4(),
                    email: "other_email@email.com",
                    roomId: existingRoom.id,
                    bookingDate: new Date("1995-12-19T01:00:00.000+02:00"),
                    isConfirmed: true
                }
            ])
            .returning("*");
        const existingInvoices = await db<Invoice>("invoices")
            .insert(
                existingBookings.map((booking) => ({
                    id: v4(),
                    bookingId: booking.id,
                    price: pricePerDay.toFixed(2)
                }))
            )
            .returning("*");

        const response = await request.get("/invoice");

        expect(response.status).toBe(200);
        const responseBody = response.body as {
            invoices?: Invoice[];
        };
        expect(responseBody.invoices).toHaveLength(existingInvoices.length);
        expect(responseBody.invoices).toEqual(
            expect.arrayContaining(existingInvoices)
        );
    });
    it("return a invoice according to id", async () => {
        const pricePerDay = 100;
        const existingRoom = (
            await db<Room>("rooms").insert({ name: "some_room" }).returning("*")
        )[0];
        const existingBookings = await db<Booking>("bookings")
            .insert([
                {
                    id: v4(),
                    email: "some_email@email.com",
                    roomId: existingRoom.id,
                    bookingDate: new Date("1995-12-16T01:00:00.000+02:00"),
                    isConfirmed: true
                },
                {
                    id: v4(),
                    email: "other_email@email.com",
                    roomId: existingRoom.id,
                    bookingDate: new Date("1995-12-19T01:00:00.000+02:00"),
                    isConfirmed: true
                }
            ])
            .returning("*");
        const existingInvoices = await db<Invoice>("invoices")
            .insert(
                existingBookings.map((booking) => ({
                    id: v4(),
                    bookingId: booking.id,
                    price: pricePerDay.toFixed(2)
                }))
            )
            .returning("*");

        const response = await request.get(
            `/invoice/${existingInvoices[0].id}`
        );
        expect(response.status).toBe(200);
        const responseBody = response.body as {
            invoices?: Invoice[];
        };
        expect(responseBody.invoices).toHaveLength(1);
        expect(responseBody.invoices?.[0]).toEqual(existingInvoices[0]);
    });
    it("reply with 404 if requested invoice doesnt exist", async () => {
        const inexistentInvoiceId = v4();
        const response = await request.get(`/invoice/${inexistentInvoiceId}`);
        expect(response.status).toBe(404);
        const responseBody = response.body as {
            message: string;
        };
        expect(responseBody.message).toMatch(
            /requested invoice does not exist/i
        );
    });
    it("reply with 400 if requested invoice id is not an uuid", async () => {
        const response = await request.get(`/invoice/not-an-uuid`);
        expect(response.status).toBe(400);
        const responseBody = response.body as {
            message: string;
        };
        expect(responseBody.message).toMatch(/invalid invoice id format/i);
    });
    it.skip("reply with status code 500 if some error occurs", () => {
        // maybe do this -> mock
    });
});
