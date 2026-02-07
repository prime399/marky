import React from "react";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "../query/queryClient";

const AppProviders = ({ children }) => {
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
};

export default AppProviders;
