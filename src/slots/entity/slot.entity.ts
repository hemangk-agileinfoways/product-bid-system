import { Entity, ObjectIdColumn, ObjectId, Column, BeforeInsert, BeforeUpdate } from "typeorm";
import { TABLE_NAMES } from "../../common/constants/table-name.constant";
import { ObjectId as MongoId } from 'mongodb';

@Entity({ name: TABLE_NAMES.SLOT })
export class Slot {
  @ObjectIdColumn()
  _id: ObjectId;

  @Column(() => MongoId)
  productId: MongoId;

  @Column({ type: 'decimal', nullable: false })
  bidPrice: number;

  @Column({ type: 'int', nullable: false })
  slotCount: number;

  @Column({ type: 'date' })
  createdAt: Date;

  @Column({ type: 'date' })
  updatedAt: Date;

  @BeforeInsert()
  setCreationTimestamps() {
    this.createdAt = new Date();
    this.updatedAt = new Date();
  }

  @BeforeUpdate()
  updateTimestamp() {
     this.updatedAt = new Date();
  }
  
}
