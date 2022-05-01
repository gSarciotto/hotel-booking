import { config } from "dotenv";

interface Environment {
    SERVER_PORT: number;
    JWT_SECRET: string;
    // postgres
    POSTGRES_HOST: string;
    POSTGRES_PORT: number;
    POSTGRES_DATABASE: string;
    POSTGRES_USER: string;
    POSTGRES_PASSWORD: string;
    // rabbitmq
    RABBITMQ_HOST: string;
    RABBITMQ_PORT: number;
    RABBITMQ_USER: string;
    RABBITMQ_PASSWORD: string;
}

type RawEnvironment = { [k in keyof Environment]: string };

export function getEnvironment(): Environment {
    const result = config();
    if (result.error) {
        console.error("Error when getting environment", result.error);
        throw result.error;
    }
    const rawEnvironment = result.parsed as RawEnvironment;
    return {
        SERVER_PORT: Number(rawEnvironment.SERVER_PORT),
        JWT_SECRET: rawEnvironment.JWT_SECRET,
        POSTGRES_HOST: rawEnvironment.POSTGRES_HOST,
        POSTGRES_PORT: Number(rawEnvironment.POSTGRES_PORT),
        POSTGRES_DATABASE: rawEnvironment.POSTGRES_DATABASE,
        POSTGRES_USER: rawEnvironment.POSTGRES_USER,
        POSTGRES_PASSWORD: rawEnvironment.POSTGRES_PASSWORD,
        RABBITMQ_HOST: rawEnvironment.RABBITMQ_HOST,
        RABBITMQ_PORT: Number(rawEnvironment.RABBITMQ_PORT),
        RABBITMQ_USER: rawEnvironment.RABBITMQ_USER,
        RABBITMQ_PASSWORD: rawEnvironment.RABBITMQ_PASSWORD
    };
}
