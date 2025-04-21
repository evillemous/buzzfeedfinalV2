import { createRoot } from "react-dom/client";
import { StrictMode } from "react";
import App from "./App";
import "./index.css";

document.title = "yourbuzzfeed - Breaking Stories & Exclusive Content";

const rootElement = document.getElementById("root");
if (rootElement) {
  try {
    const root = createRoot(rootElement);
    root.render(
      <StrictMode>
        <App />
      </StrictMode>
    );
    console.log("App mounted successfully");
  } catch (error) {
    console.error("Error mounting React application:", error);
  }
} else {
  console.error("Root element not found! Cannot mount React application");
}
