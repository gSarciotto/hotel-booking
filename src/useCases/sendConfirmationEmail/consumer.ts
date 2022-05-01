import { Channel } from "amqplib";
import { Knex } from "knex";
import { Booking } from "../../database/models/booking";
import { startRabbitConsumer } from "../../rabbit/rabbit";
import { sendBookingConfirmationEmail } from "./useCase";

export async function createSendBookingConfirmationConsumer({
    channel,
    db,
    host,
    sendEmail,
    signToken
}: {
    channel: Channel;
    db: Knex;
    host: string;
    sendEmail: (email: string, content: string) => Promise<void>;
    signToken: (email: string) => Promise<string>;
}) {
    await startRabbitConsumer(
        channel,
        "send_booking_confirmation",
        (message) => {
            if (!message) {
                return;
            }
            // do validation
            const messageContent = JSON.parse(
                message.content.toString()
            ) as Booking;
            messageContent.bookingDate = new Date(messageContent.bookingDate);
            sendBookingConfirmationEmail({
                bookingInformation: messageContent,
                db,
                host,
                sendEmail,
                signToken
            }).catch((err) => {
                console.error(err);
                throw err;
            });
        }
    );
}
