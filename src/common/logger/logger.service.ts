import { Injectable, Scope, ConsoleLogger } from "@nestjs/common";

@Injectable({ scope: Scope.TRANSIENT })
export class LoggerService extends ConsoleLogger {
  customLog(message) {
    // Customize your log using configuration
    this.log(message);
  }
}
