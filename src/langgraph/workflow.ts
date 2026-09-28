import { MemorySaver } from "@langchain/langgraph";
import { graph } from "./graph";

const checkpointer = new MemorySaver(); // Change to Postgre later for persistance

export const workflow = graph.compile({ checkpointer });
