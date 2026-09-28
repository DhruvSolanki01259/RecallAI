import { PromptTemplate } from "@langchain/core/prompts";

export const SHORT_TERM_MEMORY_PROMPT = (summary: boolean) =>
  summary
    ? PromptTemplate.fromTemplate(`
        You are a conversation memory manager.

        Your task is to UPDATE an existing conversation summary using only the new conversation information provided below.

        ## Existing Summary
        {summary}

        ## New Conversation
        {conversation}

        ## Instructions
        - Preserve all important information from the existing summary unless it is explicitly corrected or contradicted.
        - Incorporate only genuinely new information from the new conversation.
        - Preserve:
          - User facts and personal information explicitly shared by the user
          - User preferences and requirements
          - Decisions that have been made
          - Goals, tasks, and ongoing work
          - Important technical/project context
          - Constraints, limitations, and requirements
          - Important conclusions or unresolved issues
          - Relevant references to previous decisions or plans
        - If new information corrects previous information, replace the outdated information with the new information.
        - Remove temporary details, repetition, greetings, filler, small talk, and information that is no longer relevant.
        - Do not invent, infer, or assume information that was not explicitly stated.
        - Do not include the assistant's reasoning or unnecessary conversational details.
        - Keep the summary compact while preserving information that would help an assistant continue the conversation naturally.

        ## Output Requirements
        Return ONLY the updated summary.
        Do not add headings such as "Summary:".
        Do not explain what was changed.

        Updated Summary:
      `)
    : PromptTemplate.fromTemplate(`
        You are a conversation memory manager.

        Your task is to create a concise but information-dense summary of the conversation below so that another assistant can continue the conversation without losing important context.

        ## Conversation
        {conversation}

        ## Preserve
        Extract and preserve:
        - User facts explicitly shared in the conversation
        - User preferences and communication preferences
        - Current goals and objectives
        - Tasks and ongoing work
        - Important decisions and conclusions
        - Technical/project context
        - Requirements and constraints
        - Problems, errors, and their current status
        - Important unresolved questions or next steps
        - Any information that is necessary to understand future messages

        ## Exclude
        Do not include:
        - Greetings and pleasantries
        - Repeated information
        - Small talk
        - Temporary conversational filler
        - The assistant's reasoning
        - Speculation or assumptions
        - Information that does not help continue the conversation

        ## Rules
        - Do not invent or infer facts.
        - Prefer specific information over vague descriptions.
        - Preserve important names, technologies, decisions, numbers, and constraints when relevant.
        - If the conversation contains conflicting information, preserve the most recent explicit information.
        - Keep the summary concise and information-dense.
        - Write the summary in third person or neutral context so it can be consumed by another assistant.

        ## Output Requirements
        Return ONLY the summary.
        Do not add "Summary:" or any other explanation.

        Summary:
       `);
