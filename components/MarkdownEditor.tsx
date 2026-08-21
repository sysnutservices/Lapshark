"use client";

import dynamic from "next/dynamic";
import { useState } from "react";

const MDEditor = dynamic(() => import("@uiw/react-md-editor"), {
    ssr: false
});

export default function MarkdownEditor() {
    const [value, setValue] = useState<string>("");

    return (
        <div data-color-mode="light">
            <MDEditor
                value={value}
                onChange={(val) => setValue(val || "")}
                height={400}
            />

            {/* This is what you save */}
            <pre className="mt-4 bg-slate-100 p-2">
                {value}
            </pre>
        </div>
    );
}
