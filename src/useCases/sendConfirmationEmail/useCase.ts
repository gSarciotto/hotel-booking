import { Knex } from "knex";
import { Booking } from "../../database/models/booking";
import { Room } from "../../database/models/room";

export async function sendBookingConfirmationEmail({
    bookingInformation,
    db,
    host,
    sendEmail,
    signToken
}: {
    bookingInformation: Pick<
        Booking,
        "email" | "id" | "roomId" | "bookingDate"
    >;
    db: Knex;
    host: string;
    sendEmail: (email: string, content: string) => Promise<void>;
    signToken: (email: string) => Promise<string>;
}): Promise<void> {
    const token = await signToken(bookingInformation.email);
    const confirmationLink = getConfirmationLink(
        bookingInformation.id,
        token,
        host
    );
    const room = await db<Room>("rooms")
        .select("name")
        .where("id", bookingInformation.roomId)
        .first();
    if (!room) {
        //do something
        throw new Error();
    }
    const emailContent = formatEmailContent(
        {
            email: bookingInformation.email,
            roomName: room?.name,
            bookingId: bookingInformation.id,
            bookingDate: bookingInformation.bookingDate
        },
        confirmationLink
    );
    await sendEmail(bookingInformation.email, emailContent);
}

function formatEmailContent(
    bookingInformation: Pick<Booking, "email" | "bookingDate"> & {
        bookingId: Booking["id"];
        roomName: Room["name"];
    },
    link: string
): string {
    return `Hello ${bookingInformation.email}.
    Please confirm your booking of room ${
        bookingInformation.roomName
    } on date ${bookingInformation.bookingDate.toDateString()}
    ${link}
    `;
}

function getConfirmationLink(
    bookingId: Booking["id"],
    token: string,
    host: string
): string {
    return `http://${host}/booking/${bookingId}/confirm?token=${encodeURI(
        token
    )}`;
}
