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

import { ChatMessage } from "./components/chat/chat";

type MemoryVector = MemoryVectorStore["memoryVectors"][number];
const embeddings = new HuggingFaceTransformersEmbeddings({
  modelName: "Xenova/all-MiniLM-L6-v2",
});

const vectorstore = new MemoryVectorStore(embeddings);

const uniqueVectors = new Set<string>();

const RESPONSE_SYSTEM_TEMPLATE = `You are an assistant that helps to interpret medical exams and give advice based on the patient's medical records.

Guidelines:
1. Analyze provided exam results and medical context
2. Interpret findings clinically and holistically 
3. Identify key patterns and correlations
4. Use accessible medical terminology
5. Be clear about information gaps
6. Limit response to 1-2 short paragraphs

Focus only on:
- Key findings interpretation
- Clinical significance
- Essential missing information
- Most relevant medical insights

Keep responses under 100 words. Don't use markdown or complex formatting.

If insufficient context exists, briefly state what specific information would be needed for proper assessment.

Always prioritize medical accuracy while being concise and clear.`;

const modelConfig = {
  model: "Phi-3.5-mini-instruct-q4f16_1-MLC",
  chatOptions: {
    temperature: 0.1,
  },
};
let webllmModel: ChatWebLLM;

const initializeModel = async () => {
  if (webllmModel) {
    return;
  }
  console.log("Initializing WebLLM model...");

  webllmModel = new ChatWebLLM(modelConfig);

  try {
    await webllmModel.initialize((event) =>
      self.postMessage({ type: "init_progress", data: event })
    );

    self.postMessage({ type: "ready" });
    console.log("Model initialized successfully");

    self.postMessage({ type: "complete", data: "OK" });
  } catch (error) {
    console.error("Model initialization failed:", error);
    self.postMessage({
      type: "error",
      error: `Failed to initialize model: ${error}`,
    });
  }
};

// Start initialization immediately
initializeModel();

const embedPDF = async (pdfBlob: Blob) => {
  const pdfLoader = new WebPDFLoader(pdfBlob, { parsedItemSeparator: " " });
  const docs = await pdfLoader.load();

  const splitter = new RecursiveCharacterTextSplitter({
    chunkSize: 500,
    chunkOverlap: 50,
  });

  const splitDocs = await splitter.splitDocuments(docs);

  console.log("splitDocs", splitDocs);

  self.postMessage({
    type: "log",
    data: splitDocs,
  });

  await vectorstore.addDocuments(splitDocs);

  const vectors = vectorstore.memoryVectors;

  return vectors;
};

const embedVectors = async (vectors: MemoryVector[]) => {
  vectors.forEach((vector) => {
    uniqueVectors.add(vector.id || "");
  });
  await vectorstore.addVectors(
    vectors.map((vector) => vector.embedding),
    vectors.map((vector) => ({
      metadata: vector.metadata,
      pageContent: vector.content,
      id: vector.id,
    }))
  );
};

const generateRAGResponse = async (
  messages: ChatMessage[],
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
    console.log("response", response);
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
      ["system", RESPONSE_SYSTEM_TEMPLATE],
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

  if (event.data.vectors) {
    embedVectors(event.data.vectors);
  }

  if (event.data.records) {
    await vectorstore.addDocuments(
      event.data.records.map((record: any) => ({
        pageContent: `Título: ${record.title}\nDescripción: ${
          record.description
        }\nFecha: ${record.date.toLocaleDateString()}`,
      }))
    );
  }

  if (event.data.pdf) {
    try {
      const vectors = await embedPDF(event.data.pdf);
      self.postMessage({
        type: "data",
        data: vectors,
      });
    } catch (e: any) {
      self.postMessage({
        type: "error",
        error: e.message,
      });
      throw e;
    }
  } else {
    await webllmModel.initialize((event) =>
      self.postMessage({ type: "init_progress", data: event })
    );
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
