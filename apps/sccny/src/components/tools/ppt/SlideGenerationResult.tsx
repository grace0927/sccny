"use client";

import { Button, Card, CardContent, CardHeader, CardTitle } from "dark-blue";

interface SlideGenerationResultProps {
  presentationUrl: string;
  presentationId: string;
  missingHymns?: string[];
  onStartOver: () => void;
}

export default function SlideGenerationResult({
  presentationUrl,
  missingHymns,
  onStartOver,
}: SlideGenerationResultProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>幻灯片已生成</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="rounded-md bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 p-4">
          <p className="text-sm text-green-800 dark:text-green-200 font-medium">
            Google Slides 已成功生成并保存到共享云端硬盘文件夹。
          </p>
        </div>
        {missingHymns && missingHymns.length > 0 && (
          <div className="rounded-md bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-800 p-4">
            <p className="text-sm text-yellow-800 dark:text-yellow-200 font-medium mb-1">
              以下诗歌在诗歌库中未找到歌词，幻灯片中只有标题页：
            </p>
            <ul className="list-disc list-inside text-sm text-yellow-700 dark:text-yellow-300 space-y-0.5">
              {missingHymns.map((h) => <li key={h}>{h}</li>)}
            </ul>
          </div>
        )}
        <div className="flex flex-col sm:flex-row gap-3">
          <a href={presentationUrl} target="_blank" rel="noopener noreferrer" className="flex-1">
            <Button className="w-full">在 Google Slides 中打开</Button>
          </a>
          <Button variant="outline" onClick={onStartOver}>
            重新开始
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
