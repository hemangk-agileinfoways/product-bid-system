import { UserRole } from "../../users/entity/user.entity";

export interface JwtPayload {
  id: string;
  userId: string;
  email: string;
  role: UserRole;
}
