import supertest from "supertest";
import {
    PostgreSqlContainer,
    StartedPostgreSqlContainer
} from "testcontainers";
import { startDatabase } from "../../src/database/database";
import { startServer } from "../../src/app";
import { Knex } from "knex";

describe("GET /room should reply with status code 200 and", () => {
    let server: ReturnType<typeof startServer>;
    let request: ReturnType<typeof supertest.agent>;
    let db: Knex;
    let container: StartedPostgreSqlContainer;

    beforeAll(async () => {
        container = await new PostgreSqlContainer()
            .withDatabase("getRoomstest_db") // maybe randomize this
            .start();
        db = await startDatabase({
            host: container.getHost(),
            port: container.getPort(),
            database: container.getDatabase(),
            user: container.getUsername(),
            password: container.getPassword()
        });
        server = startServer({ db, port: 3100 });
        request = supertest.agent(server);
    });

    beforeEach(async () => {
        await db("rooms").delete();
    });

    afterAll(async () => {
        server?.close();
        await db?.destroy();
        await container?.stop();
    });

    it("a list of rooms", async () => {
        const existingRoomNames = ["first-room", "second-room"];
        await db("rooms").insert(
            existingRoomNames.map((roomName) => ({ name: roomName }))
        );

        const response = await request.get("/room");

        expect(response.status).toBe(200);
        const responseBody = response.body as {
            rooms?: Array<{ name: string }>;
        };
        expect(responseBody.rooms?.map((room) => room?.name)).toEqual(
            expect.arrayContaining(existingRoomNames)
        );
    });
    it("an empty list of rooms if there isnt any rooms", async () => {
        const response = await request.get("/room");

        expect(response.status).toBe(200);
        const responseBody = response.body as {
            rooms?: Array<{ name: string }>;
        };
        expect(Array.isArray(responseBody?.rooms)).toBe(true);
        expect(responseBody?.rooms).toHaveLength(0);
    });
    it.skip("reply with status code 500 if some error occurs", () => {
        // maybe do this -> mock
    });
});
