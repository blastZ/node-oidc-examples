import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";

@Entity({
  name: "users",
})
export class User {
  @PrimaryGeneratedColumn({
    type: "bigint",
    unsigned: true,
  })
  id: number;

  @Column({
    type: "varchar",
    length: 45,
  })
  email: string;

  @Column({
    type: "varchar",
    length: 45,
  })
  password: string;

  @Column({
    type: "varchar",
    length: 45,
  })
  name: string;

  @Column({
    type: "varchar",
    length: 45,
  })
  phone: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
