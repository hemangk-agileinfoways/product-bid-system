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

interface WeightCalculation {
  baseTickets: number;
  newbieBoost: number;
  performanceBonus: number;
  decayPenalty: number;
  finalWeight: number;
}

@Entity({ name: TABLE_NAMES.RESULT })
export class Result {
  @ObjectIdColumn()
  _id: ObjectId;

  @Column()
  productId: string;

  @Column()
  winnerId: string;

  @Column()
  winningBidId: string;

  @Column("json")
  weightCalculation: Record<string, WeightCalculation>;

  @Column("decimal", { precision: 10, scale: 2 })
  totalTickets: number;

  @CreateDateColumn()
  declaredAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @BeforeInsert()
  setCreatedAt() {
    this.declaredAt = new Date();
    this.updatedAt = new Date();
  }

  @BeforeUpdate()
  setUpdatedAt() {
    this.updatedAt = new Date();
  }
}
