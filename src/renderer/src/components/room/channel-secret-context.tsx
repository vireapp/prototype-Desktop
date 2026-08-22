"use client";

import { createContext, useContext } from "react";

export const ChannelSecretContext = createContext<string>("");

export const useChannelSecret = () => {
  const context = useContext(ChannelSecretContext);
  if (context === undefined) {
    throw new Error("useChannelSecret must be used within a ChannelSecretProvider");
  }
  return context;
};
