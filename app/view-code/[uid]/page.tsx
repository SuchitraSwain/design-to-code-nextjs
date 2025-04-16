"use client";
import AppHeader from "@/app/_components/AppHeader";
import Constants from "@/data/Constants";
import axios from "axios";
import { Loader2, LoaderCircle } from "lucide-react";
import { useParams, usePathname } from "next/navigation";
import React, { useEffect, useState } from "react";
import SelectionDetail from "../_components/SelectionDetail";
import CodeEditor from "../_components/CodeEditor";
import { read } from "fs";

export interface RECORD {
  id: number;
  description: string;
  code: any;
  imageUrl: string;
  model: string;
  createdBy: string;
  uid: string;
}

function ViewCode() {
  const { uid } = useParams();
  const [loading, setLoading] = useState(false);
  const [codeResp, setCodeResp] = useState("");
  const [record, setRecord] = useState<RECORD | null>();
  const [isReady, setIsReady] = useState(false);
  // const [isExistingCode,setIsExistingCode]=useState();
  useEffect(() => {
    if (typeof window !== undefined) {
      uid && GetRecordInfo();
    }
  }, [uid]);

  const GetRecordInfo = async (regen = false) => {
    setIsReady(false);
    setCodeResp("");
    setLoading(true);

    const result = await axios.get("/api/wireframe-to-code?uid=" + uid);

    const resp = result?.data;
    setRecord(result?.data);

    if (resp?.code == null || regen) {
      GenerateCode(resp);
    } else {
      setCodeResp(resp?.code?.resp);
      setLoading(false);
      setIsReady(true);
    }
    if (resp?.error) {
      setCodeResp(resp?.error);
    }
    // setLoading(false);
  };

  const GenerateCode = async (record: RECORD) => {
    try {
      setLoading(true);
      setCodeResp(""); // Optional: Clear previous output if needed

      const res = await fetch("/api/ai-model", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          description: `${record?.description}: ${Constants.PROMPT}`,
          model: record.model,
          imageUrl: record?.imageUrl,
        }),
      });

      if (!res.ok || !res.body) {
        throw new Error("Failed to receive a response from the AI API");
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });

        const cleanedText = chunk
          .replace(/```(jsx|javascript)?/g, "")
          .replace(/<\/?script>/g, ""); // Optional: sanitize further

        setCodeResp((prev) => prev + cleanedText);
      }

      setIsReady(true);
      UpdateCodeToDb();
    } catch (error) {
      console.error("Error generating code:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (codeResp != "" && record?.uid && isReady && record?.code == null) {
      UpdateCodeToDb();
    }
  }, [codeResp && record && isReady]);

  const UpdateCodeToDb = async () => {
    const result = await axios.put("/api/wireframe-to-code", {
      uid: record?.uid,
      codeResp: { resp: codeResp },
    });
  };

  console.log(codeResp, "asdasdasdasdasd");

  return (
    <div>
      <AppHeader hideSidebar={true} />
      <div className="grid grid-cols-1 md:grid-cols-5 p-5 gap-10">
        <div>
          {/* Selection Details  */}
          <SelectionDetail
            record={record}
            regenrateCode={() => {
              GetRecordInfo(true);
            }}
            isReady={isReady}
          />
        </div>
        <div className="col-span-4">
          {/* Code Editor  */}
          {loading ? (
            <div>
              <h2
                className="font-bold text-2xl text-center p-20 flex items-center justify-center
                        bg-slate-100 h-[80vh] rounded-xl
                        "
              >
                {" "}
                <Loader2 className="animate-spin" /> Anaylzing the Wireframe...
              </h2>
            </div>
          ) : (
            <CodeEditor codeResp={codeResp} isReady={isReady} />
          )}
        </div>
      </div>
    </div>
  );
}

export default ViewCode;
