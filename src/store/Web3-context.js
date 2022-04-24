import React from "react";

const Web3Context = React.createContext({
  walletAddress: "",
  provider: "",
  signer: "",
  contract: "",
  connectWallet: () => {},
  checkIfWalletConnected: () => {},
});

export default Web3Context;
