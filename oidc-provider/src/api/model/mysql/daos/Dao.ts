import { getRepository, Repository } from "typeorm";

class Dao<T> {
  repo: Repository<T>;

  constructor(entity: new () => T) {
    this.repo = getRepository(entity);
  }
}

export default Dao;
