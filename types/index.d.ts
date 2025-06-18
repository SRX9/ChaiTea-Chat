import { Message } from "@ai-sdk/react";

declare module "@/lib/db" {
  interface ChaiTeaMessage extends Message {
    threadId: string;
  }
}
