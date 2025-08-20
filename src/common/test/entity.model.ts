import { Users } from "../../users/entity/user.entity";
import { MockModel } from "./mock.model";

export class UserModel extends MockModel<Users> {
  protected entityStub = new Users();
}
