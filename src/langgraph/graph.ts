import { END, START, StateGraph } from "@langchain/langgraph";
import { ChatState } from "./states/chat.state";
import { ChatNode } from "./nodes/chat.node";
import { ToolNode } from "@langchain/langgraph/prebuilt";
import { tools } from "./tools/index";
import { SummarizeNode } from "./nodes/summarize.node";
import { AIMessage } from "langchain";

const ChatRouter = (state: typeof ChatState.State) => {
  const lastMessage = state.messages[state.messages.length - 1];
  if (
    lastMessage instanceof AIMessage &&
    lastMessage.tool_calls &&
    lastMessage.tool_calls.length > 0
  ) {
    console.log("Routing To TOOLS");
    return "tools";
  }

  if (state.messages.length > 20) {
    console.log("Routing To SUMMARIZE");
    return "summarize";
  }

  console.log("Routing To END");
  return "end";
};

export const graph = new StateGraph(ChatState)
  // NODES
  .addNode("chat_node", ChatNode)
  .addNode("tool_node", new ToolNode(tools))
  .addNode("summarize_node", SummarizeNode)

  // EDGES
  .addEdge(START, "chat_node")
  .addEdge("tool_node", "chat_node")
  .addEdge("summarize_node", END)

  // CONDITIONAL EDGES
  .addConditionalEdges("chat_node", ChatRouter, {
    tools: "tool_node",
    summarize: "summarize_node",
    end: END,
  });
