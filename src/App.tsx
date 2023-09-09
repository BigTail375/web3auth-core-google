import { useEffect, useState } from "react";
import { Web3AuthCore } from "@web3auth/core";
import {
  WALLET_ADAPTERS,
  CHAIN_NAMESPACES,
  SafeEventEmitterProvider,
} from "@web3auth/base";
import { OpenloginAdapter } from "@web3auth/openlogin-adapter";
import "./App.css";
// import RPC from "./evm.web3";
// import RPC from './evm.ethers';
import RPC from "./solanaRPC";
import { Col, Row } from "react-bootstrap";
import CodeEditor from "@uiw/react-textarea-code-editor";

const clientId =
  "BG7vMGIhzy7whDXXJPZ-JHme9haJ3PmV1-wl9SJPGGs9Cjk5_8m682DJ-lTDmwBWJe-bEHYE_t9gw0cdboLEwR8"; // get from https://dashboard.web3auth.io

// const rpcTarget =
//   process.env.REACT_APP_QUICKNODE || "https://rpc.ankr.com/solana";

function App() {
  const [web3auth, setWeb3auth] = useState<Web3AuthCore | null>(null);
  const [provider, setProvider] = useState<SafeEventEmitterProvider | null>(
    null
  );

  const [codeInput, setCodeInput] = useState("");
  const [result, setResult] = useState("");
  const [option, setOption] = useState("Catalyst");
  const [loading, setLoading] = useState(false);

  const submitHandler = async (e: any) => {
    e.preventDefault();
    try {
      const response = await fetch("http://localhost:5000/asked/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userInput: codeInput,
          option,
        }),
      });

      const data: { messages: { message: { content: string } }[] } =
        await response.json();

      setResult(
        data.messages.reduce(
          (result, choice) => `${result} ${choice.message.content}`,
          ""
        )
      );
    } catch (err) {}
  };

  const handleAttachClick = (e: any) => {
    e.preventDefault();
  };

  const handlePasteClick = (e: any) => {
    e.preventDefault();
  };

  useEffect(() => {
    const init = async () => {
      try {
        const web3auth = new Web3AuthCore({
          clientId, // get from https://dashboard.web3auth.io
          chainConfig: {
            chainNamespace: CHAIN_NAMESPACES.SOLANA,
            chainId: "0x3", // Please use 0x1 for Mainnet, 0x2 for Testnet, 0x3 for Devnet
            rpcTarget: "https://api.devnet.solana.com",
            displayName: "Solana Devnet",
            blockExplorer: "https://explorer.solana.com/?cluster=devnet",
            ticker: "SOL",
            tickerName: "Solana Token",
          },
        });

        const openloginAdapter = new OpenloginAdapter({
          adapterSettings: {
            clientId,
            network: "testnet",
            uxMode: "popup",
            loginConfig: {
              google: {
                name: "Custom Google Auth Login",
                verifier: "web3auth-core-google",
                typeOfLogin: "google",
                clientId:
                  "774338308167-q463s7kpvja16l4l0kko3nb925ikds2p.apps.googleusercontent.com", //use your app client id you got from google
              },
            },
          },
        });
        web3auth.configureAdapter(openloginAdapter);
        setWeb3auth(web3auth);

        await web3auth.init();
        if (web3auth.provider) {
          setProvider(web3auth.provider);
        }
      } catch (error) {
        console.error(error);
      }
    };

    init();
  }, []);

  const [account, setAccount] = useState("");
  const login = async () => {
    if (!web3auth) {
      uiConsole("web3auth not initialized yet");
      return;
    }
    const web3authProvider = await web3auth.connectTo(
      WALLET_ADAPTERS.OPENLOGIN,
      {
        loginProvider: "google",
      }
    );
    setProvider(web3authProvider);
  };

  const getUserInfo = async () => {
    if (!web3auth) {
      uiConsole("web3auth not initialized yet");
      return;
    }
    const user = await web3auth.getUserInfo();
    
    uiConsole(user);
  };

  const logout = async () => {
    if (!web3auth) {
      uiConsole("web3auth not initialized yet");
      return;
    }
    await web3auth.logout();
    setProvider(null);
  };

  const getAccounts = async () => {
    if (!provider) {
      uiConsole("provider not initialized yet");
      return;
    }
    const rpc = new RPC(provider);
    const userAccount = await rpc.getAccounts();
    setAccount(userAccount[0])
    uiConsole(userAccount);
  };

  const getBalance = async () => {
    if (!provider) {
      uiConsole("provider not initialized yet");
      return;
    }
    const rpc = new RPC(provider);
    const balance = await rpc.getBalance();
    uiConsole(balance);
  };

  const signMessage = async () => {
    if (!provider) {
      uiConsole("provider not initialized yet");
      return;
    }
    const rpc = new RPC(provider);
    const result = await rpc.signMessage();
    uiConsole(result);
  };

  const sendTransaction = async () => {
    if (!provider) {
      uiConsole("provider not initialized yet");
      return;
    }
    const rpc = new RPC(provider);
    const result = await rpc.sendTransaction();
    uiConsole(result);
  };

  function uiConsole(...args: any[]): void {
    const el = document.querySelector("#console>p");
    if (el) {
      el.innerHTML = JSON.stringify(args || {}, null, 2);
    }
  }

  useEffect(() => {
    if(provider) {
      getAccounts()
    }
  }, [provider])

  const loginView = (
    <>
      <div>
        {loading && <div className="loading_container">Loading</div>}
        <div className="text-center m-0 app-bar">boolai : {account}</div>
        <Row>
          <Col md={7} className="p-0">
            <div className="result-container">
              <textarea
                className="result-box"
                type="text"
                value={result}
                readOnly
              />
            </div>
          </Col>
          <Col md={5} className="p-0">
            <div className="code-box">
              <CodeEditor
                value={codeInput}
                language="solidity"
                placeholder="Please enter Solidity code."
                onChange={(e: any) => setCodeInput(e.target.value)}
                padding={15}
                style={{
                  fontSize: 12,
                  width: "100%",
                  margin: "0 0 0 0",
                  backgroundColor: "#151319",
                  fontFamily:
                    "ui-monospace,SFMono-Regular,SF Mono,Consolas,Liberation Mono,Menlo,monospace",
                }}
              />
            </div>
          </Col>
        </Row>
        <Row className="control-container">
          <Col md={4}>
            <button type="button" onClick={handleAttachClick}>
              Attach
            </button>
            <button type="button" className="ms-2" onClick={handlePasteClick}>
              Paste
            </button>
            <button type="button" className="ms-2" onClick={logout}>
              Logout
            </button>
          </Col>
          <Col md={4} style={{ textAlign: "center" }}>
            <select
              className="select-box"
              onChange={(e) => setOption(e.target.value)}
            >
              <option value="Catalyst">Gas Optimisation Report</option>
              <option value="Developer">Edge Case Report</option>
              <option value="Executive">Attack Vector Report</option>
              <option value="Generic">Simple Audit Report</option>
              <option value="Scientist">Vulnerability Report</option>
            </select>
          </Col>
          <Col md={4} style={{ textAlign: "right" }}>
            <button type="button" onClick={submitHandler}>
              Submit
            </button>
          </Col>
        </Row>
      </div>
    </>
  );

  const logoutView = (
    <div className="login-button">
      <button onClick={login}>Login</button>
    </div>
  );

  console.log(provider);
  return <div>{provider ? loginView : logoutView}</div>;
}

export default App;
