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
import { Invoice } from "../../src/database/models/invoice";
import { sign, TokenExpiredError } from "jsonwebtoken";

describe("GET /booking/:id/confirm should", () => {
    let server: ReturnType<typeof startServer>;
    let request: ReturnType<typeof supertest.agent>;
    let container: StartedPostgreSqlContainer;
    let db: Knex;
    const existingRoom: Room = {
        id: 10,
        name: "some room name"
    };
    const unconfirmedBooking: Booking = {
        id: v4(),
        roomId: existingRoom.id,
        bookingDate: new Date("1995-12-16T01:00:00.000+02:00"),
        email: "email_1@email.com",
        isConfirmed: false
    };
    const jwtSecret = "some-Veryhard-secret";

    beforeAll(async () => {
        container = await new PostgreSqlContainer()
            .withDatabase("confirm_booking_test") // maybe randomize this
            .start();
        db = await startDatabase({
            host: container.getHost(),
            port: container.getPort(),
            database: container.getDatabase(),
            user: container.getUsername(),
            password: container.getPassword()
        });
        await db("rooms").insert(existingRoom);
        server = startServer(db, 3600);
        request = supertest.agent(server);
    });

    beforeEach(async () => {
        await db("invoices").delete();
        await db("bookings").delete();
    });

    afterAll(async () => {
        server?.close();
        await db?.destroy();
        await container?.stop();
    });

    it("change confirmation status of a previously unconfirmed booking", async () => {
        await db("bookings").insert(unconfirmedBooking);
        const token = createToken(unconfirmedBooking.email, jwtSecret);
        const response = await request
            .get(`/booking/${unconfirmedBooking.id}/confirm`)
            .query({ token });
        expect(response.status).toBe(200);
        const previouslyUnconfirmedBooking = await db<Booking>("bookings")
            .select("*")
            .where("id", unconfirmedBooking.id)
            .first();
        expect(previouslyUnconfirmedBooking?.isConfirmed).toBe(true);
    });

    it("create an invoice when booking is confirmed", async () => {
        await db("bookings").insert(unconfirmedBooking);
        const token = createToken(unconfirmedBooking.email, jwtSecret);
        const response = await request
            .get(`/booking/${unconfirmedBooking.id}/confirm`)
            .query({ token });
        expect(response.status).toBe(200);
        const createdInvoice = await db<Invoice>("invoices")
            .select("*")
            .first();
        expect({
            price: Number(createdInvoice?.price),
            bookingId: createdInvoice?.bookingId
        }).toEqual({
            price: 100,
            bookingId: unconfirmedBooking.id
        });
    });

    it("be idempotent", async () => {
        await db("bookings").insert(unconfirmedBooking);
        const token = createToken(unconfirmedBooking.email, jwtSecret);
        const firstResponse = await request
            .get(`/booking/${unconfirmedBooking.id}/confirm`)
            .query({ token });
        expect(firstResponse.status).toBe(200);
        const createdInvoiceAfterFirstRequest = await db<Invoice>("invoices")
            .select("*")
            .first();
        const secondResponse = await request
            .get(`/booking/${unconfirmedBooking.id}/confirm`)
            .query({ token });
        expect(secondResponse.status).toBe(200);
        const invoicesAfterSecondRequest = await db<Invoice>("invoices").select(
            "*"
        );
        expect(invoicesAfterSecondRequest).toHaveLength(1);
        expect(invoicesAfterSecondRequest[0]).toEqual(
            createdInvoiceAfterFirstRequest
        );
    });

    it("reply with 404 if booking doesnt exist", async () => {
        const unexistentBookingId = v4();
        const token = createToken(unconfirmedBooking.email, jwtSecret);
        const response = await request
            .get(`/booking/${unexistentBookingId}/confirm`)
            .query({ token });
        expect(response.status).toBe(404);
        const responseBody = response.body as { message?: string };
        expect(responseBody.message).toBe(
            "Requested booking to be confirmed does not exist"
        );
        const bookings = await db<Booking>("bookings").select("*");
        expect(bookings).toEqual([]);
        const invoices = await db<Invoice>("invoices").select("*");
        expect(invoices).toEqual([]);
    });

    it("reply with 400 if booking id supplied is not an uuid", async () => {
        const response = await request.get(`/booking/not-an-uuid/confirm`);
        expect(response.status).toBe(400);
        const responseBody = response.body as { message?: string };
        expect(responseBody.message).toBe("Invalid booking id format");
    });

    it.skip("reply with 400 if supplied token is invalid", () => {
        //todo
    });
});

describe("GET /booking/:id/confirm should", () => {
    let server: ReturnType<typeof startServer>;
    let request: ReturnType<typeof supertest.agent>;
    let container: StartedPostgreSqlContainer;
    let db: Knex;
    const existingRoom: Room = {
        id: 10,
        name: "some room name"
    };
    const unconfirmedBooking: Booking = {
        id: v4(),
        roomId: existingRoom.id,
        bookingDate: new Date("1995-12-16T01:00:00.000+02:00"),
        email: "email_1@email.com",
        isConfirmed: false
    };

    beforeAll(async () => {
        container = await new PostgreSqlContainer()
            .withDatabase("confirm_booking_test") // maybe randomize this
            .start();
        db = await startDatabase({
            host: container.getHost(),
            port: container.getPort(),
            database: container.getDatabase(),
            user: container.getUsername(),
            password: container.getPassword()
        });
        await db("rooms").insert(existingRoom);
    });

    beforeEach(async () => {
        await db("invoices").delete();
        await db("bookings").delete();
    });

    afterEach(() => {
        server?.close();
    });

    afterAll(async () => {
        await db?.destroy();
        await container?.stop();
    });

    it("reply with 403 is supplied token is expired", async () => {
        server = startServer(db, 3600, () => {
            return Promise.reject(new TokenExpiredError("expired", new Date()));
        });
        request = supertest.agent(server);
        const jwtSecret = "some-Veryhard-secret";
        await db("bookings").insert(unconfirmedBooking);
        const expiredToken = sign(
            {
                email: unconfirmedBooking.email,
                iat: Date.now() - 100000,
                exp: Date.now() - 10000
            },
            jwtSecret
        );
        const response = await request
            .get(`/booking/${unconfirmedBooking.id}/confirm`)
            .query({ token: expiredToken });
        expect(response.status).toBe(403);
        const previouslyUnconfirmedBooking = await db<Booking>("bookings")
            .select("*")
            .where("id", unconfirmedBooking.id)
            .first();
        expect(previouslyUnconfirmedBooking?.isConfirmed).toBe(false);
        const invoices = await db("invoices").select("*");
        expect(invoices).toEqual([]);
    });
});

function createToken(email: string, secret: string) {
    return sign({ email }, secret, { expiresIn: "1h" });
}
