### Dependencies
This project depends on node.JS, docker, docker-compose being installed in the machine.

### How to start
1. Install dependencies
```
npm ci
```
2. Start services
```
npm run start-containers
```
3. Start web-server
```
npm run start:dev
```

When finished, just remember to stop the services:
```
npm run stop-containers
```

You can change the parameters for the containers in the `docker-compose.yml`, however make sure to also change them in the `.env` file if necessary so that the web-server can connect to them.

### Tests
To run tests:
```
npm run test
```

The tests use real containers to run the services (postgres and rabbitMQ), so they may take a while and even timeout. If timeout happens, you can try to download the docker images:
```
docker pull rabbitmq && docker pull postgres:13.3-alpine
```
and run the tests again. If the tests still times out, can increase the timeout limit from the test by placing `jest.timeout(1000 * number_of_seconds)` inside the test file (default is 5 seconds).

The tests are all integration (actually E2E, we dont have a frontend) since there isn't really logic, it is mostly a CRUD application. Each test suite gets its own services (database and broker), this is done via [testcontainers](https://github.com/testcontainers/testcontainers-node) which I learned while doing this test.


### General overview
The project consists of 3 parts:
1. A web-server
2. A postgres database
3. A RabbitMQ broker

The broker consists of a single queue to which new bookings are sent so that we can send a confirmation email to user (it actually just logs the email to stdout). Sending the email doesn't need to happen in the booking request-response cycle, so it makes more sense to do it asynchronously, allowing for the booking to happen even if the email server is down. Notice that the queue is very simple: no complex retry logic and things like that.

There is a heavy use of dependency injection to decouple different parts of the application and allowing to mock when needed.

The project could be improved in some areas, specially in regards to validation and the DI, however I think it is good enough for a test.