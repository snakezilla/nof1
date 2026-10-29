import { rawSignalText, type RawStream } from "../../lib/raw-stream";

/** One night read straight off the strap. Renders nothing without raw-stream.json. */
export function RawSignal({ stream }: { stream: RawStream | null }) {
  if (!stream) return null;
  return (
    <div className="prov__block">
      <h4 className="prov__heading">The raw signal</h4>
      <p className="prov__para">{rawSignalText(stream)}</p>
    </div>
  );
}
