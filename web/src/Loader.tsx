import { useEffect, useState } from "react";
import App from "./App";
import type { DataState } from "./lib/dataset";
import { loadDataset } from "./lib/load";

/** Dev path: no embedded data, so fetch the files. Production pages hydrate instead. */
export function Loader({ base }: { base: string }) {
  const [state, setState] = useState<DataState>({ status: "loading" });

  useEffect(() => {
    let live = true;
    loadDataset((url) => fetch(url), base)
      .then((data) => live && setState({ status: "ready", data }))
      .catch((err: unknown) => {
        const message = err instanceof Error ? err.message : "unknown error";
        if (live) setState({ status: "error", message });
      });
    return () => {
      live = false;
    };
  }, [base]);

  return <App state={state} />;
}
