"use client";

import React, { useEffect, useState } from "react";
import { ChatLayout } from "../components/chat/chat-layout";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "../components/ui/dialog";
import Gamma from "../lib/gamma";
import { getSelectedModel } from "../lib/model-helper";
import { ChatInstance } from "./Chat";
import { useDynamicContext } from "@dynamic-labs/sdk-react-core";
import { DynamicConnectButton, DynamicEmbeddedWidget, DynamicWidget } from "@dynamic-labs/sdk-react-core";
import { ChatOllama } from "@langchain/community/chat_models/ollama";
import { AIMessage, HumanMessage } from "@langchain/core/messages";
import { BytesOutputParser } from "@langchain/core/output_parsers";
import { ChatRequestOptions } from "ai";
import { Message, useChat } from "ai/react";
import { toast } from "sonner";
import { v4 as uuidv4 } from "uuid";

export default function Home() {
  return <ChatInstance />;
}