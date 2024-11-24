import {
  Annotation,
  MessagesAnnotation,
  StateGraph,
} from "@langchain/langgraph/web";

import { WebPDFLoader } from "@langchain/community/document_loaders/web/pdf";

import { HuggingFaceTransformersEmbeddings } from "@langchain/community/embeddings/hf_transformers";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { type BaseMessage } from "@langchain/core/messages";
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import type { LanguageModelLike } from "@langchain/core/language_models/base";

import { LangChainTracer } from "@langchain/core/tracers/tracer_langchain";
import { Client } from "langsmith";

import { ChatWebLLM } from "@langchain/community/chat_models/webllm";
import { Document } from "@langchain/core/documents";
import { RunnableConfig } from "@langchain/core/runnables";
import { MemoryVectorStore } from "langchain/vectorstores/memory";

const embeddings = new HuggingFaceTransformersEmbeddings({
  modelName: "Xenova/all-MiniLM-L6-v2",
  // Can use "nomic-ai/nomic-embed-text-v1" for more powerful but slower embeddings
  // modelName: "nomic-ai/nomic-embed-text-v1",
});

const vectorstore = new MemoryVectorStore(embeddings);

type ChatWindowMessage = {
  content: string;
  role: "user" | "assistant";
  runId?: string;
  traceUrl?: string;
};

const WEBLLM_RESPONSE_SYSTEM_TEMPLATE = `You are an experienced researcher, expert at interpreting and answering questions based on provided sources. Using the provided context, answer the user's question to the best of your ability using the resources provided.
Generate a concise answer for a given question based solely on the provided search results. You must only use information from the provided search results. Use an unbiased and journalistic tone. Combine search results together into a coherent answer. Do not repeat text, stay focused, and stop generating when you have answered the question.
If there is nothing in the context relevant to the question at hand, just say "Hmm, I'm not sure." Don't try to make up an answer.`;

const embedPDF = async (pdfBlob: Blob) => {
  const pdfLoader = new WebPDFLoader(pdfBlob, { parsedItemSeparator: " " });
  const docs = await pdfLoader.load();

  const splitter = new RecursiveCharacterTextSplitter({
    chunkSize: 500,
    chunkOverlap: 50,
  });

  const splitDocs = await splitter.splitDocuments(docs);

  self.postMessage({
    type: "log",
    data: splitDocs,
  });

  await vectorstore.addDocuments(splitDocs);
};

const generateRAGResponse = async (
  messages: ChatWindowMessage[],
  {
    model,
    devModeTracer,
  }: {
    model: LanguageModelLike;
    devModeTracer?: LangChainTracer;
  }
) => {
  const RAGStateAnnotation = Annotation.Root({
    ...MessagesAnnotation.spec,
    rephrasedQuestion: Annotation<string>,
    sourceDocuments: Annotation<Document[]>,
  });

  const rephraseQuestion = async (
    state: typeof RAGStateAnnotation.State,
    config: RunnableConfig
  ) => {
    const originalQuery = state.messages.at(-1)?.content as string;

    const rephrasePrompt = ChatPromptTemplate.fromMessages([
      ["placeholder", "{messages}"],
      [
        "user",
        "Given the above conversation, rephrase the following question into a standalone, natural language query with important keywords that a researcher could later pass into a search engine to get information relevant to the conversation. Do not respond with anything except the query.\n\n<question_to_rephrase>\n{input}\n</question_to_rephrase>",
      ],
    ]);

    const formattedPrompt = await rephrasePrompt.invoke(
      {
        messages: state.messages,
        input: originalQuery,
      },
      config
    );

    const response = await model.invoke(formattedPrompt, config);
    // ChromeAI is a text-in, text-out LLM and we therefore must wrap it in a message object
    if (typeof response === "string") {
      return { rephrasedQuestion: response };
    } else {
      return { rephrasedQuestion: response.content };
    }
  };

  const retrieveSourceDocuments = async (
    state: typeof RAGStateAnnotation.State,
    config: RunnableConfig
  ) => {
    let retrieverQuery: string;
    if (state.rephrasedQuestion != null) {
      retrieverQuery = state.rephrasedQuestion;
    } else {
      retrieverQuery = state.messages.at(-1)?.content as string;
    }
    const retriever = vectorstore.asRetriever();
    const docs = await retriever.invoke(retrieverQuery, config);
    return {
      sourceDocuments: docs,
    };
  };

  const generateResponse = async (
    state: typeof RAGStateAnnotation.State,
    config: RunnableConfig
  ) => {
    const context = state.sourceDocuments
      .map((sourceDoc: any) => {
        return `<doc>\n${sourceDoc.pageContent}\n</doc>`;
      })
      .join("\n\n");

    const responseChainPrompt = ChatPromptTemplate.fromMessages<{
      context: string;
      messages: BaseMessage[];
    }>([
      ["system", WEBLLM_RESPONSE_SYSTEM_TEMPLATE],
      [
        "user",
        "When responding to me, use the following documents as context:\n<context>\n{context}\n</context>",
      ],
      [
        "assistant",
        "Understood! I will use the documents between the above <context> tags as context when answering your next questions.",
      ],
      ["placeholder", "{messages}"],
    ]);
    const formattedPrompt = await responseChainPrompt.invoke(
      {
        context,
        messages: state.messages,
      },
      config
    );

    const response = await model
      .withConfig({ tags: ["response_generator"] })
      .invoke(formattedPrompt, config);
    // ChromeAI is a text-in, text-out LLM and we therefore must wrap it in a message-like object
    if (typeof response === "string") {
      return { messages: [{ role: "assistant", content: response }] };
    } else {
      return { messages: [response] };
    }
  };

  const graph = new StateGraph(RAGStateAnnotation)
    .addNode("rephraseQuestion", rephraseQuestion)
    .addNode("retrieveSourceDocuments", retrieveSourceDocuments)
    .addNode("generateResponse", generateResponse)
    .addConditionalEdges("__start__", async (state: any) => {
      if (state.messages.length > 1) {
        return "rephraseQuestion";
      }
      return "retrieveSourceDocuments";
    })
    .addEdge("rephraseQuestion", "retrieveSourceDocuments")
    .addEdge("retrieveSourceDocuments", "generateResponse")
    .compile();

  const eventStream = await graph.streamEvents(
    {
      messages,
    },
    {
      version: "v2",
      callbacks: devModeTracer !== undefined ? [devModeTracer] : [],
    }
  );

  for await (const { event, data, tags } of eventStream) {
    if (tags?.includes("response_generator")) {
      if (event === "on_chat_model_stream") {
        self.postMessage({
          type: "chunk",
          data: data.chunk.content,
        });
        // Chrome LLM is a text-in/text-out model
      } else if (event === "on_llm_stream") {
        self.postMessage({
          type: "chunk",
          data: data.chunk.text,
        });
      }
    }
  }

  self.postMessage({
    type: "complete",
    data: "OK",
  });
};

// Listen for messages from the main thread
self.addEventListener("message", async (event: { data: any }) => {
  console.log("RECEIVED MESSAGE");
  self.postMessage({
    type: "log",
    data: `Received data!`,
  });

  let devModeTracer;
  if (
    event.data.DEV_LANGCHAIN_TRACING !== undefined &&
    typeof event.data.DEV_LANGCHAIN_TRACING === "object"
  ) {
    devModeTracer = new LangChainTracer({
      projectName: event.data.DEV_LANGCHAIN_TRACING.LANGCHAIN_PROJECT,
      client: new Client({
        apiKey: event.data.DEV_LANGCHAIN_TRACING.LANGCHAIN_API_KEY,
      }),
    });
  }

  if (event.data.pdf) {
    try {
      await embedPDF(event.data.pdf);
    } catch (e: any) {
      self.postMessage({
        type: "error",
        error: e.message,
      });
      throw e;
    }
  } else {
    const modelConfig = event.data.modelConfig;
    const webllmModel = new ChatWebLLM(modelConfig);
    await webllmModel.initialize((event) =>
      self.postMessage({ type: "init_progress", data: event })
    );
    // Best guess at Phi-3.5 tokens
    const model = webllmModel.bind({
      stop: ["\nInstruct:", "Instruct:", "<hr>", "\n<hr>"],
    });

    try {
      await generateRAGResponse(event.data.messages, { devModeTracer, model });
    } catch (e: any) {
      self.postMessage({
        type: "error",
        error: `${e.message}. Make sure your browser supports WebLLM/WebGPU.`,
      });
      throw e;
    }
  }

  self.postMessage({
    type: "complete",
    data: "OK",
  });
});