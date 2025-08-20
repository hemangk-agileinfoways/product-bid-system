import { TABLE_NAMES } from "../../common/constants/table-name.constant";
import { Entity, Column, ObjectIdColumn, ObjectId } from "typeorm";

export enum UserRole {
  ADMIN = "ADMIN",
  USER = "USER"
}

@Entity({ name: TABLE_NAMES.USER })
export class Users {
  @ObjectIdColumn()
  _id: ObjectId;

  @Column({ nullable: false })
  first_name: string;

  @Column({ nullable: false })
  last_name: string;

  @Column({ nullable: false, unique: true })
  email: string;

  @Column({ nullable: true })
  phone_number: string;

  @Column({ nullable: false })
  password: string;

  @Column({ 
    type: 'enum',
    enum: UserRole,
    default: UserRole.USER
  })
  role: UserRole;

  @Column({ nullable: false, default: true })
  is_active: boolean;
}
