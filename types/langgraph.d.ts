// types/langgraph.d.ts
import { BaseMessage } from "@langchain/core/messages";

declare module "@langchain/langgraph" {
  interface StreamEvent {
    event: string;
    data: StreamEventData;
  }

  interface StreamEventData {
    chunk?: BaseMessage;
    tool?: string; // Para on_tool_start
    output?: any; // Para on_tool_end, ajusta según el tipo real de salida
  }
}