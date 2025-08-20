export abstract class MockModel<T> {
  protected abstract entityStub: T;

  findOne(): T | null {
    return this.entityStub || null;
  }
  async find(): Promise<T[]> {
    return [this.entityStub];
  }

  async create(): Promise<T> {
    return this.entityStub;
  }

  async save(): Promise<T> {
    return this.entityStub;
  }

  async update(): Promise<T> {
    return this.entityStub;
  }

  async delete(): Promise<T> {
    return this.entityStub;
  }

  findOneBy(): T | null {
    return this.entityStub || null;
  }

  async getUserByEmail(): Promise<T[]> {
    return [this.entityStub];
  }
}
