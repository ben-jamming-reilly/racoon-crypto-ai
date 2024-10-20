"use state";

import React, { useEffect, useState } from "react";
import { ChatLayout } from "../components/chat/chat-layout";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "../components/ui/dialog";
import Gamma from "../lib/gamma";
import { getSelectedModel } from "../lib/model-helper";
import { DynamicEmbeddedWidget } from "@dynamic-labs/sdk-react-core";
import { useDynamicContext } from "@dynamic-labs/sdk-react-core";
import { ChatOllama } from "@langchain/community/chat_models/ollama";
import { AIMessage, HumanMessage } from "@langchain/core/messages";
import { BytesOutputParser } from "@langchain/core/output_parsers";
import { ChatRequestOptions } from "ai";
import { Message, useChat } from "ai/react";
import { toast } from "sonner";

export function ChatInstance({ id = "" }: { id?: string }) {
  const { messages, input, handleInputChange, handleSubmit, isLoading, error, stop, setMessages, setInput } = useChat({
    onResponse: response => {
      if (response) {
        setLoadingSubmit(false);
      }
    },
    onError: error => {
      setLoadingSubmit(false);
      toast.error("An error occurred. Please try again.");
    },
  });
  const [chatId, setChatId] = React.useState<string>(id);
  const [selectedModel, setSelectedModel] = React.useState<string>(getSelectedModel());
  const [gamma, setGamma] = React.useState<Gamma | null>(null);
  const [open, setOpen] = React.useState(true);
  const env = process.env.NODE_ENV;
  const [loadingSubmit, setLoadingSubmit] = React.useState(false);

  useEffect(() => {
    if (selectedModel === "Browser Model") {
      console.log("Selected model: Browser");
      const gammaInstance = Gamma.getInstance();
      setGamma(gammaInstance);
    }
  }, [setSelectedModel, selectedModel]);

  React.useEffect(() => {
    if (chatId) {
      const item = localStorage.getItem(`chat_${chatId}`);
      if (item) {
        setMessages(JSON.parse(item));
      }
    }
  }, [setMessages]);

  const addMessage = (Message: any) => {
    console.log("addMessage:", Message);
    messages.push(Message);
    window.dispatchEvent(new Event("storage"));
    setMessages([...messages]);
  };

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoadingSubmit(true);

    try {
      // Add the user message to the chat
      addMessage({ role: "user", content: input, id: chatId });
      setInput("");

      if (gamma === null) {
        const gammaInstance = Gamma.getInstance();
        setGamma(gammaInstance);
      }

      // Generate a response
      const responseGenerator = gamma ? await gamma.summarize(input) : (async function* () {})();
      console.log("Response from Browser Model:", responseGenerator);

      let responseMessage = "";
      // Display response chunks as they arrive and append them to the message
      for await (const chunk of responseGenerator) {
        responseMessage += chunk;

        window.dispatchEvent(new Event("storage"));
        setMessages([...messages, { role: "assistant", content: responseMessage, id: chatId }]);
        setLoadingSubmit(false);
      }
    } catch (error) {
      console.error("Error processing message with Browser Model:", error);
    }
  };
  // When starting a new chat, append the messages to the local storage
  React.useEffect(() => {
    if (!isLoading && !error && messages.length > 0) {
      localStorage.setItem(`chat_${chatId}`, JSON.stringify(messages));
      // Trigger the storage event to update the sidebar component
      window.dispatchEvent(new Event("storage"));
    }
  }, [messages, chatId, isLoading, error]);

  const { primaryWallet } = useDynamicContext();

  useEffect(() => {
    if (!primaryWallet) {
      setOpen(true);
    } else {
      setOpen(false);
    }
  }, [primaryWallet]);

  return (
    <main className="flex flex-col items-center h-full">
      <Dialog open={open} onOpenChange={setOpen}>
        <ChatLayout
          chatId={chatId}
          setSelectedModel={setSelectedModel}
          messages={messages}
          input={input}
          handleInputChange={handleInputChange}
          handleSubmit={onSubmit}
          isLoading={isLoading}
          loadingSubmit={loadingSubmit}
          error={error}
          stop={stop}
          navCollapsedSize={10}
          defaultLayout={[30, 160]}
        />
        <DialogContent className="flex flex-col space-y-4">
          <DialogHeader className="space-y-2">
            <DialogTitle>Welcome to Ollama!</DialogTitle>
            <DialogDescription>
              Enter your name to get started. This is just to personalize your experience.
            </DialogDescription>

            <DynamicEmbeddedWidget background="none" />
          </DialogHeader>
        </DialogContent>
      </Dialog>
    </main>
  );
}
