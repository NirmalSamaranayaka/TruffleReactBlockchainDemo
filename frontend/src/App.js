// React DApp connecting to SimpleStorage smart contract
import { useState, useEffect } from "react";
import Web3 from "web3";
import SimpleStorage from "./contracts/SimpleStorage.json";
import "./App.css";

function App() {
  const [state, setState] = useState({
    web3: null,
    contract: null,
    accounts: [],
  });

  const [data, setData] = useState("N/A");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Alert state
  const [alertMsg, setAlertMsg] = useState("");
  const [alertType, setAlertType] = useState(""); // "success" | "error"

  // Auto-dismiss alert after 3 seconds
  useEffect(() => {
    if (alertMsg) {
      const timer = setTimeout(() => {
        setAlertMsg("");
        setAlertType("");
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [alertMsg]);

  // Initialize Web3
  useEffect(() => {
    const initWeb3 = async () => {
      try {
        const provider = new Web3.providers.HttpProvider("http://127.0.0.1:7545");
        const web3 = new Web3(provider);

        const networkId = await web3.eth.net.getId();
        const deployedNetwork = SimpleStorage.networks[networkId];

        if (!deployedNetwork) {
          throw new Error("Smart contract not deployed to the detected network.");
        }

        const contract = new web3.eth.Contract(
          SimpleStorage.abi,
          deployedNetwork.address
        );

        const accounts = await web3.eth.getAccounts();

        setState({ web3, contract, accounts });
        setLoading(false);
      } catch (err) {
        console.error("Failed to load web3, accounts, or contract:", err);
        setError(err.message || "Unknown error occurred");
        setLoading(false);
      }
    };

    initWeb3();
  }, []);

  // Fetch contract data
  useEffect(() => {
    const fetchData = async () => {
      const { contract } = state;
      if (contract) {
        try {
          const value = await contract.methods.getter().call();
          setData(value);
        } catch (err) {
          console.error("Error reading contract data:", err);
          setError("Failed to read contract data");
        }
      }
    };

    fetchData();
  }, [state.contract]);

  // Write data
  const writeData = async () => {
    const { contract, accounts } = state;
    const input = document.querySelector("#value").value;

    if (!input) {
      setAlertMsg("Please enter a value");
      setAlertType("error");
      return;
    }

    if (!accounts || accounts.length === 0) {
      setAlertMsg("No accounts detected. Make sure Ganache or MetaMask is running.");
      setAlertType("error");
      return;
    }

    try {
      await contract.methods
        .setter(input)
        .send({ from: accounts[0] });

      const updatedData = await contract.methods.getter().call();
      setData(updatedData);

      setAlertMsg("Data updated successfully!");
      setAlertType("success");
    } catch (err) {
      console.error("Error writing data:", err);
      setAlertMsg("Failed to write data to contract. Check console for details.");
      setAlertType("error");
    }
  };

  if (loading) {
    return <div className="App">Loading Web3, accounts, and contract...</div>;
  }

  if (error) {
    return <div className="App">Error: {error}</div>;
  }

  return (
    <div className="App">
      <h1>Welcome to SimpleStorage DApp</h1>
      <p>Connected Account: {state.accounts[0]}</p>
      <p>Contract Data: {data}</p>

      {/* Styled auto-dismiss alerts */}
      {alertMsg && (
        <div className={`alert ${alertType}`}>
          {alertMsg}
        </div>
      )}
      

      <input
        type="number"
        id="value"
        placeholder="Enter new value"
        required
      />
      <button onClick={writeData} className="button button2">
        Update Data
      </button>
    </div>
  );
}

export default App;
