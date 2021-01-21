# Node-OIDC-Examples

Show how to use node oidc provider.

## Get started

Check below steps to start examples.

### Init MySQL

Init mysql enviroment for user find examples.

```bash
$ docker run -p 3318:3306 -v mysql:/var/lib/mysql --name mysql -e MYSQL_ROOT_PASSWORD=admin123 -d mysql:latest --default-authentication-plugin=mysql_native_password
```

Create default database

```sql
create database `oidc-examples`;
```

### Init Redis

Inirt redis enviroment for cache examples.

```bash
$ docker run -dt --name redis -p 6379:6379 redis:latest
```

### Insert Default User

```sql
insert into `oidc-examples`.`users`(`email`, `password`, `name`, `phone`) values('test@test.com', 'admin123', 'test', '1818');
```

### Start openid provider

```bash
$ cd oidc-provider
$ npm install
$ npm run dev
```

### Check client examples

check `/clients` to find client examples
