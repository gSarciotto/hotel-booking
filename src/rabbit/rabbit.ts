import amqplib, { ConsumeMessage } from "amqplib";

export async function startRabbitMQ(
    config: Pick<
        amqplib.Options.Connect,
        "hostname" | "port" | "username" | "password"
    >
) {
    return amqplib.connect(config);
}

export async function publishMessageToQueue(
    channel: amqplib.Channel,
    queue: string,
    message: string | Buffer
) {
    await channel.assertQueue(queue);
    channel.sendToQueue(queue, Buffer.from(message));
}

export async function startRabbitConsumer(
    channel: amqplib.Channel,
    queue: string,
    callback: (message: ConsumeMessage | null) => void
): Promise<void> {
    await channel.assertQueue(queue);
    await channel.consume(queue, callback);
}
