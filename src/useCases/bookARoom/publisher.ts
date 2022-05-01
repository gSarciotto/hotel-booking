import { Channel } from "amqplib";
import { Booking } from "../../database/models/booking";
import { publishMessageToQueue } from "../../rabbit/rabbit";

export async function publishNewBooking(
    channel: Channel,
    newBooking: Booking
): Promise<void> {
    await publishMessageToQueue(
        channel,
        "send_booking_confirmation",
        JSON.stringify(newBooking)
    );
    return Promise.resolve();
}
