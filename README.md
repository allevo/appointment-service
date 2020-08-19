# Appointment Service
A Appointment service

## Start

## Before: mysql

```sh
docker run --name some-mysql -e MYSQL_ROOT_PASSWORD=1234 -p3306:3306 -d --rm mysql:5
```

### Run locally

```sh
npm ci
set -a
source local.env
npm start
```

### Test
```sh
npm ci
npm test
```

## TODO

- [x] http interface
- [x] login
- [x] ACL
- [x] Test
- [x] Better swagger tag
- [ ] Configure CI
- [ ] Move to Lambda using [aws-lambda-fastify](https://github.com/fastify/aws-lambda-fastify)
