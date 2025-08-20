import { Entity, ObjectIdColumn, ObjectId, Column, BeforeInsert, BeforeUpdate } from "typeorm";
import { TABLE_NAMES } from "../../common/constants/table-name.constant";
import { ProductStatus } from "../constants/enum.constant";

@Entity({ name: TABLE_NAMES.PRODUCT })
export class Product {
  @ObjectIdColumn()
  _id: ObjectId;

  @Column({ nullable: false })
  name: string;

  @Column({ nullable: false })
  image: string;

  @Column({ nullable: false })
  description: string;

  @Column({ nullable: false, type: 'decimal' })
  amount: number;

  @Column({
    type: 'enum',
    enum: ProductStatus,
    default: ProductStatus.READY_FOR_SLOT
  })
  status: ProductStatus;

  @Column({ type: 'boolean', default: false })
  hasSlots: boolean;

  @Column({ type: 'boolean', default: false })
  hasBids: boolean;

  @Column()
  createdAt: Date;

  @Column()
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

  @BeforeInsert()
  setDefaults() {
    const now = new Date();
    this.createdAt = now;
    this.updatedAt = now;

    if (!this.status) {
        this.status = ProductStatus.READY_FOR_SLOT;
    }

    if (this.hasSlots === undefined) {
        this.hasSlots = false;
    }

    if (this.hasBids === undefined) {
        this.hasBids = false;
    }
  }
}
