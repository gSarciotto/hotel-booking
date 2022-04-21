import type { Knex } from "knex";

const config: { [key: string]: Knex.Config } = {
    test: {
        client: "pg",
        migrations: {
            directory: "./src/database/migrations"
        }
    },
    development: {
        client: "pg",
        migrations: {
            directory: "./src/database/migrations"
        }
    },
    staging: {
        client: "pg",
        migrations: {
            directory: "./src/database/migrations"
        }
    },
    production: {
        client: "pg",
        migrations: {
            directory: "./src/database/migrations"
        }
    }
    /*
  development: {
    client: "sqlite3",
    connection: {
      filename: "./dev.sqlite3"
    }
  },

  staging: {
    client: "postgresql",
    connection: {
      database: "my_db",
      user: "username",
      password: "password"
    },
    pool: {
      min: 2,
      max: 10
    },
    migrations: {
      tableName: "knex_migrations"
    }
  },

  production: {
    client: "postgresql",
    connection: {
      database: "my_db",
      user: "username",
      password: "password"
    },
    pool: {
      min: 2,
      max: 10
    },
    migrations: {
      tableName: "knex_migrations"
    }
  }
  */
};

module.exports = config;
