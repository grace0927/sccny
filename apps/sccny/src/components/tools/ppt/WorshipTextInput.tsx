"use client";

import { useState } from "react";
import { Button, Card, CardContent, CardHeader, CardTitle } from "dark-blue";
import { DEFAULT_WORSHIP_ORDER_TEMPLATE, parseWorshipOrder, WorshipOrderData } from "@/lib/parse-worship-order";

interface WorshipTextInputProps {
  onParsed: (data: WorshipOrderData, rawText: string) => void;
}

export default function WorshipTextInput({ onParsed }: WorshipTextInputProps) {
  const [text, setText] = useState(DEFAULT_WORSHIP_ORDER_TEMPLATE);

  function handleParse() {
    const data = parseWorshipOrder(text);
    onParsed(data, text);
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>第一步：输入本周崇拜程序</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          请将本周崇拜程序粘贴或编辑到下方文本框，每行一个项目。编辑完成后点击「解析预览」。
        </p>
        <textarea
          className="w-full min-h-[320px] rounded-md border border-input bg-background px-3 py-2 text-sm font-mono text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-y"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="粘贴崇拜程序..."
          spellCheck={false}
        />
        <div className="flex justify-end">
          <Button onClick={handleParse}>解析预览 →</Button>
        </div>
      </CardContent>
    </Card>
  );
}
