import { User } from "../entities";
import Dao from "./Dao";

export class UserDao extends Dao<User> {
  constructor() {
    super(User);
  }

  async getUserById(id: number) {
    return this.repo.findOne({ id });
  }

  async getUserByEmail(email: string) {
    return this.repo.findOne({ email });
  }
}
