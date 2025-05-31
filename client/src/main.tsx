import { createRoot } from "react-dom/client";
import { Buffer } from 'buffer';
import App from "./App";
import "./index.css";

// Polyfill Buffer for Solana Web3.js browser compatibility
(window as any).Buffer = Buffer;

createRoot(document.getElementById("root")!).render(<App />);
