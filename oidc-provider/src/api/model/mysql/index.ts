import "reflect-metadata";
import { createConnection, getConnection } from "typeorm";

import { UserDao } from "./daos";
import { User } from "./entities";

class DB {
  userDao: UserDao;

  init() {
    this.userDao = new UserDao();
  }

  async connect(url: string) {
    if (!url) return;

    const mysqlUrl = new URL(url);
    const database = mysqlUrl.pathname;

    await createConnection({
      name: "default",
      type: "mysql",
      url,
      database,
      entities: [User],
      logging: process.env.NODE_ENV === "development",
      logger: "advanced-console",
      synchronize: process.env.NODE_ENV === "development",
      bigNumberStrings: false,
      supportBigNumbers: true,
    });

    this.init();
  }

  async disconnect() {
    await getConnection().close();
  }
}

const db = new DB();

export default db;
