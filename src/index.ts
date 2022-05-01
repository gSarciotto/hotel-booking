import { Connection } from "amqplib";
import { Knex } from "knex";
import { startServer } from "./app";
import { startDatabase } from "./database/database";
import { Booking } from "./database/models/booking";
import { getEnvironment } from "./environment";
import { startRabbitMQ } from "./rabbit/rabbit";
import { publishNewBooking } from "./useCases/bookARoom/publisher";
import { createSendBookingConfirmationConsumer } from "./useCases/sendConfirmationEmail/consumer";
import { sendEmail } from "./utils/email";
import { decodeToken, signToken as signJwt } from "./utils/jwt";

const env = getEnvironment();

let db: Knex;
let rabbitMQConnection: Connection;

startDatabase({
    host: env.POSTGRES_HOST,
    port: env.POSTGRES_PORT,
    database: env.POSTGRES_DATABASE,
    user: env.POSTGRES_USER,
    password: env.POSTGRES_PASSWORD
})
    .then((postgresConnection) => {
        console.log("db started");
        db = postgresConnection;
    })
    .then(() => {
        return startRabbitMQ({
            hostname: env.RABBITMQ_HOST,
            port: env.RABBITMQ_PORT,
            username: env.RABBITMQ_USER,
            password: env.RABBITMQ_PASSWORD
        });
    })
    .then((connection) => {
        console.log("rabbitmq started");
        rabbitMQConnection = connection;
        return rabbitMQConnection.createChannel();
    })
    .then(async (rabbitMQChannel) => {
        await createSendBookingConfirmationConsumer({
            channel: rabbitMQChannel,
            db,
            host: `localhost:${env.SERVER_PORT}`,
            sendEmail,
            signToken: (email: string) => signJwt(email, env.JWT_SECRET)
        });
        return Promise.resolve(rabbitMQChannel);
    })
    .then((rabbitMQChannel) => {
        const wrappedPublishNewBooking = (booking: Booking) =>
            publishNewBooking(rabbitMQChannel, booking);

        startServer({
            db,
            port: env.SERVER_PORT,
            decodeJwt: (token: string) => decodeToken(token, env.JWT_SECRET),
            publishNewBooking: wrappedPublishNewBooking
        });
    })
    .catch(async (err) => {
        console.error("Error on server start", err);
        await db?.destroy();
        await rabbitMQConnection?.close();
    });
