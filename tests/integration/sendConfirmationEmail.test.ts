import { Knex } from "knex";
import {
    GenericContainer,
    PostgreSqlContainer,
    StartedPostgreSqlContainer,
    StartedTestContainer
} from "testcontainers";
import { startDatabase } from "../../src/database/database";
import { Room } from "../../src/database/models/room";
import { Booking } from "../../src/database/models/booking";
import { Channel } from "amqplib";
import { publishMessageToQueue, startRabbitMQ } from "../../src/rabbit/rabbit";
import { createSendBookingConfirmationConsumer } from "../../src/useCases/sendConfirmationEmail/consumer";

describe("sendConfirmationEmail consumer from new bookings queue should", () => {
    jest.setTimeout(1000 * 15); //15s
    let postgresContainer: StartedPostgreSqlContainer;
    let rabbitMQContainer: StartedTestContainer;
    let db: Knex;
    let rabbitChannel: Channel;
    const existingRoom: Room = {
        id: 10,
        name: "some room name"
    };
    const sendBookingConfirmationQueueName = "send_booking_confirmation";

    beforeAll(async () => {
        postgresContainer = await new PostgreSqlContainer()
            .withDatabase("send_confirmation_email_test") // maybe randomize this
            .start();
        db = await startDatabase({
            host: postgresContainer.getHost(),
            port: postgresContainer.getPort(),
            database: postgresContainer.getDatabase(),
            user: postgresContainer.getUsername(),
            password: postgresContainer.getPassword()
        });
        rabbitMQContainer = await new GenericContainer("rabbitmq")
            .withExposedPorts(5672)
            .start();
        const rabbitConnection = await startRabbitMQ({
            hostname: rabbitMQContainer.getHost(),
            port: rabbitMQContainer.getMappedPort(5672),
            username: "guest",
            password: "guest"
        });
        rabbitChannel = await rabbitConnection.createChannel();
        await db("rooms").insert(existingRoom);
    });

    beforeEach(async () => {
        await rabbitChannel.deleteQueue(sendBookingConfirmationQueueName);
    });

    afterAll(async () => {
        await db?.destroy();
        await postgresContainer?.stop();
        await rabbitMQContainer?.stop();
    });

    it("consume message and send email with confirmation link to user", async () => {
        const bookingMessage: Booking = {
            id: "some-uuid",
            roomId: existingRoom.id,
            bookingDate: new Date(),
            isConfirmed: false,
            email: "some_email@email.com"
        };
        const token = "some-jwt-TOken";
        const someHost = "somewebsite.com";
        const sendEmailMock = jest.fn((email: string, content: string) =>
            Promise.resolve()
        );
        const signJwtMock = jest.fn((email: string) => Promise.resolve(token));
        await createSendBookingConfirmationConsumer({
            channel: rabbitChannel,
            db,
            host: someHost,
            sendEmail: sendEmailMock,
            signToken: signJwtMock
        });
        await publishMessageToQueue(
            rabbitChannel,
            sendBookingConfirmationQueueName,
            JSON.stringify(bookingMessage)
        );
        await new Promise((resolve) => {
            // wait for the message to be consume -> probably there is a better way of doing this
            setTimeout(resolve, 500);
        });
        expect(sendEmailMock).toHaveBeenCalled();
        expect(sendEmailMock.mock.calls[0][0]).toBe(bookingMessage.email);
        const emailContent = sendEmailMock.mock.calls[0][1];
        expect(emailContent).toMatch(existingRoom.name);
        expect(emailContent).toMatch(
            `http://${someHost}/booking/${
                bookingMessage.id
            }/confirm?token=${encodeURI(token)}`
        );
    });
});
