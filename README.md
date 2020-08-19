# Appointment Service ![build](https://github.com/allevo/appointment-service/workflows/build/badge.svg)

An appointment service


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

Open [http://localhost:3000/documentation/](http://localhost:3000/documentation/)

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
- [x] Configure CI
- [ ] Move to Lambda using [aws-lambda-fastify](https://github.com/fastify/aws-lambda-fastify)
