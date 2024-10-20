import { ChatCompletionRequest } from "@mlc-ai/web-llm";
import { CreateMLCEngine, MLCEngine } from "@mlc-ai/web-llm";
import { CreateServiceWorkerMLCEngine, CreateWebWorkerMLCEngine, MLCEngineInterface } from "@mlc-ai/web-llm";


const selectedModel = "Llama-3.1-8B-Instruct-q4f32_1-MLC";
//  const selectedModel ="Llama-3.1-8B-Instruct-q0f16-MLC";

class Gamma {
  private static instance: Gamma | null = null;
  private chatModule: MLCEngineInterface | null = null;
  private isInitialized: Promise<void>;

  private constructor() {
    this.isInitialized = this.initializeGemma();
  }

  // Singleton pattern to avoid multiple instances of Gamma
  public static getInstance(): Gamma {
    if (!Gamma.instance) {
      Gamma.instance = new Gamma();
    }
    return Gamma.instance;
  }

  private async initializeGemma(): Promise<void> {
    // @ts-ignore Not going to set gpu for rn
    if (navigator.gpu) {
      console.log("Initializing in-browser model");

      const engine = await CreateWebWorkerMLCEngine(
        new Worker(new URL("./worker.ts", import.meta.url), {
          type: "module",
        }),
        selectedModel,
        { initProgressCallback: initProgress => console.log(initProgress.text) }, // engineConfig
      );
      this.chatModule = engine;

      console.log("Gemma initialized");
    }
  }

  public async summarize(text: string): Promise<AsyncGenerator<string> | string> {
    if (!this.isInitialized) {
      this.isInitialized = this.initializeGemma();
    }
    await this.isInitialized;
    // @ts-ignore
    if (navigator.gpu) {
      console.log("Using Gemma...");
      // Use Gemma for summarization
      return this.streamSummarizeWithGemma(text);
    } else {
      console.log("Using Gemini...");
      // Fallback to Gemini (Google AI JavaScript SDK)
      return this.summarizeWithGeminiAPI(text);
    }
  }

  // Doesn't stream the response, just returns the final summary
  private async summarizeWithGemma(text: string): Promise<string> {
    if (!this.chatModule) throw new Error("Gemma not initialized");

    const messages = [
      { role: "system", content: "You are a helpful AI assistant." },
      { role: "user", content: text },
    ];

    const request: ChatCompletionRequest = {
      temperature: 1,
      messages: [
        { role: "system", content: "You are a helpful AI assistant." },
        { role: "user", content: text },
      ],
    };

    const res = await this.chatModule.chat.completions.create(request);
    return res.choices[0].message.content!;
  }

  // Returns as AsyncGenerator to stream the response, just like chatCompletionAsyncChunkGenerator in web-llm
  private async *streamSummarizeWithGemma(text: string): AsyncGenerator<string> {
    if (!this.chatModule) throw new Error("Gemma not initialized");
    await this.chatModule.resetChat();

    const request: ChatCompletionRequest = {
      temperature: 1,
      stream: true, // <-- Enable streaming
      stream_options: { include_usage: true },
      messages: [{ role: "user", content: text }],
    };

    const stream = await this.chatModule.chat.completions.create(request);

    // Yield each chunk of the response as it arrives
    for await (const chunk of stream) {
      yield chunk.choices.map(c => c.delta.content).join("");
    }
  }

  private async summarizeWithGeminiAPI(text: string): Promise<string> {
    try {
      const response = await fetch("/.netlify/functions/gemini-summarizer", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ prompt: text }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to fetch summary from Gemini API");
      }

      const data = await response.json();
      return data.summary;
    } catch (error: any) {
      console.error(`Error in summarizeWithGeminiAPI: ${error.message}`);
      throw error;
    }
  }
}

export default Gamma;