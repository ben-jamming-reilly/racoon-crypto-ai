"use client";

import { useState } from "react";
import Link from "next/link";
import { useDynamicContext } from "@dynamic-labs/sdk-react-core";
import type { NextPage } from "next";
import { BugAntIcon, MagnifyingGlassIcon } from "@heroicons/react/24/outline";
import { Address } from "~~/components/scaffold-eth";
import { sendTransaction, signMessage } from "~~/lib/dynamic";

const Home: NextPage = () => {
  const { primaryWallet, networkConfigurations } = useDynamicContext();
  const [messageSignature, setMessageSignature] = useState<string>("");
  const [transactionSignature, setTransactionSignature] = useState<string>("");
  const connectedAddress = primaryWallet?.address;

  const handleSignMesssage = async () => {
    try {
      const signature = await signMessage("Hello World", primaryWallet);
      setMessageSignature(signature);

      setTimeout(() => {
        setMessageSignature("");
      }, 10000);
    } catch (e) {
      console.error(e);
    }
  };

  const handleSendTransaction = async () => {
    try {
      const isTestnet = await primaryWallet?.connector?.isTestnet();

      if (!isTestnet) {
        alert("You're not on a testnet, proceed with caution.");
      }
      const hash = await sendTransaction(connectedAddress, "0.0001", primaryWallet!, networkConfigurations!);
      setTransactionSignature(hash!);

      setTimeout(() => {
        setTransactionSignature("");
      }, 10000);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <>
      <div className="flex items-center flex-col flex-grow pt-10"></div>
    </>
  );
};

export default Home;
