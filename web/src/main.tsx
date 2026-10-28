import { StrictMode } from "react";
import { createRoot, hydrateRoot } from "react-dom/client";
import App from "./App";
import { Loader } from "./Loader";
import { readEmbedded } from "./lib/dataset";
import "./styles/fonts.css";
import "./styles/tokens.css";
import "./styles/base.css";
import "./styles/hero.css";
import "./styles/findings.css";
import "./styles/test.css";
import "./styles/nights.css";
import "./styles/figures.css";
import "./styles/calendar.css";
import "./styles/tables.css";
import "./styles/provenance.css";
import "./styles/sources.css";
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
