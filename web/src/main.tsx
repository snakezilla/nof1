import { StrictMode } from "react";
import { createRoot, hydrateRoot } from "react-dom/client";
import App from "./App";
import { Loader } from "./Loader";
import { readEmbedded } from "./lib/dataset";
import "./styles/fonts.css";
import "./styles/tokens.css";
import "./styles/base.css";
import "./styles/hero.css";
import "./styles/chapters.css";
import "./styles/diagrams.css";
import "./styles/mask.css";
import "./styles/print.css";

const root = document.getElementById("root");
const embedded = readEmbedded(document);

if (root && embedded) {
  hydrateRoot(
    root,
    <StrictMode>
      <App state={embedded} />
    </StrictMode>,
  );
} else if (root) {
  createRoot(root).render(
    <StrictMode>
      <Loader base={`${import.meta.env.BASE_URL}data`} />
    </StrictMode>,
  );
}
