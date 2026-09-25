import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import {PresentationProvider} from "./PresentationSettings";
import "./index.css";
import "./modern.css";
import "./fantasy.css";
import "./refined.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <PresentationProvider><App /></PresentationProvider>
  </React.StrictMode>
);
