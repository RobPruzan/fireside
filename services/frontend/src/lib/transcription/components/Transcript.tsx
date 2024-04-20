import { useRef, useEffect } from "react";

import { TranscriberData } from "../hooks/useTranscriber";
import { formatAudioTimestamp } from "../../utils/AudioUtils";

interface Props {
  transcribedData: TranscriberData | undefined;
}

export default function Transcript({ transcribedData }: Props) {
  const divRef = useRef<HTMLDivElement>(null);

  const exportTXT = () => {
    let chunks = transcribedData?.chunks ?? [];
    let text = chunks
      .map((chunk) => chunk.text)
      .join("")
      .trim();

    const blob = new Blob([text], { type: "text/plain" });
  };

  return (
    <div
      ref={divRef}
      className="w-full flex flex-col my-2 p-4 max-h-[20rem] overflow-y-auto"
    >
      {transcribedData?.chunks &&
        transcribedData.chunks.map((chunk, i) => (
          <div
            key={`${i}-${chunk.text}`}
            className="w-full flex flex-row mb-2  rounded-lg p-4 shadow-xl shadow-black/5 ring-1 ring-slate-700/10"
          >
            <div className="mr-5">
              {formatAudioTimestamp(chunk.timestamp[0])}
            </div>
            {chunk.text}
          </div>
        ))}
    </div>
  );
}
