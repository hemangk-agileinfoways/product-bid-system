import {
  BeforeInsert,
  BeforeUpdate,
  Column,
  CreateDateColumn,
  Entity,
  ObjectId,
  ObjectIdColumn,
  UpdateDateColumn,
} from "typeorm";
import { TABLE_NAMES } from "../../../common/constants/table-name.constant";

export enum BidStatus {
  ACTIVE = "active",
  WITHDRAWN = "withdrawn",
  LOCKED = "locked",
}

interface BidSlot {
  slotId: string;
  count: number;
  bidPrice: number;
}

@Entity({ name: TABLE_NAMES.BID })
export class Bid {
  @ObjectIdColumn()
  _id: ObjectId;

  @Column()
  userId: string;

  @Column()
  prodId: string;

  @Column("json")
  slots: BidSlot[];

  @Column("decimal", { precision: 10, scale: 2 })
  totalAmount: number;

  @Column({
    type: "enum",
    enum: BidStatus,
    default: BidStatus.ACTIVE,
  })
  status: BidStatus;

  @Column({ default: true })
  isWithdrawable: boolean;

  @Column({ nullable: true })
  withdrawalTime?: Date;

  @Column({ nullable: true })
  withdrawalReason?: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @BeforeInsert()
  setCreatedAt() {
    this.createdAt = new Date();
    this.updatedAt = new Date();
  }

  @BeforeUpdate()
  setUpdatedAt() {
    this.updatedAt = new Date();
  }
}
