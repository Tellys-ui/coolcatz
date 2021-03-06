import Web3Context from "./Web3-context";
import React, { useReducer } from "react";
import { contractAddress, contractAbi } from "../utils/contract_abis";
import WalletConnect from "@walletconnect/client";
import QRCodeModal from "@walletconnect/qrcode-modal";
import WalletConnectProvider from "@walletconnect/web3-provider";
import Web3Modal from "web3modal";
import Web3 from "web3";
const { ethers } = require("ethers");

const bsc = {
  chainId: `0x${Number(56).toString(16)}`,
  chainName: "Binance Smart Chain Mainnet",
  nativeCurrency: {
    name: "Binance Chain Native Token",
    symbol: "BNB",
    decimals: 18,
  },
  rpcUrls: [
    "https://bsc-dataseed1.binance.org",
    "https://bsc-dataseed2.binance.org",
    "https://bsc-dataseed3.binance.org",
    "https://bsc-dataseed4.binance.org",
    "https://bsc-dataseed1.defibit.io",
    "https://bsc-dataseed2.defibit.io",
    "https://bsc-dataseed3.defibit.io",
    "https://bsc-dataseed4.defibit.io",
    "https://bsc-dataseed1.ninicoin.io",
    "https://bsc-dataseed2.ninicoin.io",
    "https://bsc-dataseed3.ninicoin.io",
    "https://bsc-dataseed4.ninicoin.io",
    "wss://bsc-ws-node.nariox.org",
  ],
  blockExplorerUrls: ["https://bscscan.com"],
};

const defaultWeb3State = {
  walletAddress: "",
  provider: "",
  signer: "",
  contract: "",
};

const web3Reducer = (state, action) => {
  if (action.type === "WALLET_CONNECT") {
    console.log("Wallet Connect ACTION");

    const walletAddress = action.walletAddress;
    const provider = action.provider;
    const signer = action.signer;
    const contract = action.contract;
    return {
      walletAddress: walletAddress,
      provider: provider,
      signer: signer,
      contract: contract,
    };
  }

  return defaultWeb3State;
};

const Web3Provider = (props) => {
  const [web3State, dispatchWeb3Action] = useReducer(
    web3Reducer,
    defaultWeb3State
  );

  const changeNetwork = async ({ networkName, setError }) => {
    console.log("Attempting to change network");
    try {
      if (!window.ethereum) throw new Error("No crypto wallet found");
      await window.ethereum.request({
        method: "wallet_addEthereumChain",
        params: [
          {
            ...bsc,
          },
        ],
      });
    } catch (err) {
      console.log(err.message);
    }
  };

  const instantiateContracts = (signer) => {
    return new ethers.Contract(contractAddress, contractAbi, signer);
  };

  const connectWalletHandler = async () => {
    try {
      const providerOptions = {
        walletconnect: {
          package: WalletConnectProvider,
          options: {
            // Mikko's test key - don't copy as your mileage may vary
            infuraId: "d2ae878adfc8418fb4f4d73eefa31332",
          },
        },
      };

      const { ethereum } = window;

      const web3Modal = new Web3Modal({
        cacheProvider: false, // optional
        providerOptions, // required
        disableInjectedProvider: false, // optional. For MetaMask / Brave / Opera.
        theme: {
          background: "rgb(39, 49, 56)",
          main: "rgb(199, 199, 199)",
          secondary: "rgb(136, 136, 136)",
          border: "rgba(195, 195, 195, 0.14)",
          hover: "rgb(16, 26, 32)",
        },
      });

      const provider = await web3Modal.connect();
      // Get a Web3 instance for the wallet
      const web3 = new Web3(provider);
      // Get list of accounts of the connected wallet
      const accounts = await web3.eth.getAccounts();

      const providerEthers = new ethers.providers.Web3Provider(provider); // Allows for interaction with ethereum nodes - read/write
      const signer = providerEthers.getSigner(); // Abstraction of the Ethereum Account which can be used to sign messages and transactions and send signed transactions

      dispatchWeb3Action({
        type: "WALLET_CONNECT",
        walletAddress: accounts[0],
        provider: provider,
        signer: signer,
        contract: instantiateContracts(signer),
      });
    } catch (error) {
      console.log(error);
    }
  };

  const checkIfWalletIsConnectedHandler = async () => {
    try {
      const { ethereum } = window;

      if (!ethereum) {
        return;
      }

      /*
       * Check if we're authorized to access the user's wallet
       */
      const accounts = await ethereum.request({ method: "eth_accounts" });

      // if (window.ethereum.networkVersion !== 56) {
      //   changeNetwork("bsc");
      // }

      if (accounts.length !== 0) {
        const provider = new ethers.providers.Web3Provider(ethereum); // Allows for interaction with ethereum nodes - read/write
        const signer = provider.getSigner(); // Abstraction of the Ethereum Account which can be used to sign messages and transactions and send signed transactions

        dispatchWeb3Action({
          type: "WALLET_CONNECT",
          walletAddress: accounts[0],
          provider: provider,
          signer: signer,
          contract: instantiateContracts(signer),
        });
      } else {
        console.log("No authorized account found");
      }
    } catch (error) {
      console.log(error);
    }
  };

  const web3Context = {
    walletAddress: web3State.walletAddress,
    provider: web3State.provider,
    signer: web3State.signer,
    contract: web3State.contract,
    connectWallet: connectWalletHandler,
    checkIfWalletConnected: checkIfWalletIsConnectedHandler,
  };

  return (
    <Web3Context.Provider value={web3Context}>
      {props.children}
    </Web3Context.Provider>
  );
};

export default Web3Provider;
