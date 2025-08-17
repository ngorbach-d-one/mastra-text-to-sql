import {
  ActionBarPrimitive,
  BranchPickerPrimitive,
  ComposerPrimitive,
  MessagePrimitive,
  ThreadPrimitive,
  useMessage,
  useComposerRuntime,
  useThread,
  useAssistantRuntime,
  type TextContentPart,
} from "@assistant-ui/react";
import { useEffect, useMemo, useRef, useState, type FC } from "react";
import Image from "next/image";
import {
  ArrowDownIcon,
  CheckIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  CopyIcon,
  PencilIcon,
  RefreshCwIcon,
  SendHorizontalIcon,
  MicIcon,
  SquareIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

import { Button } from "@/components/ui/button";
import { MarkdownText } from "@/components/assistant-ui/markdown-text";
import { TooltipIconButton } from "@/components/assistant-ui/tooltip-icon-button";
import BarChart from "@/components/bar-chart";
import { useUserInitials } from "@/components/user-avatar";
import { suggestedQuestions } from "@/data/suggested-questions";

export const Thread: FC = () => {
  return (
    <ThreadPrimitive.Root
      className="bg-background box-border flex h-full flex-col overflow-hidden"
      style={{
        ["--thread-max-width" as string]: "62rem",
      }}
    >
      <ThreadTitleGenerator />
      <ThreadPrimitive.Viewport className="flex h-full flex-col items-center overflow-y-scroll scroll-smooth bg-inherit px-4 pt-[88px]">
        <ThreadWelcome />

        <ThreadPrimitive.Messages
          components={{
            UserMessage: UserMessage,
            EditComposer: EditComposer,
            AssistantMessage: AssistantMessage,
          }}
        />

        <ThreadPrimitive.If empty={false}>
          <div className="min-h-8 flex-grow" />
        </ThreadPrimitive.If>

        <div className="sticky bottom-0 mt-3 flex w-full max-w-[var(--thread-max-width)] flex-col items-center justify-end rounded-t-lg bg-inherit pb-4">
          <ThreadScrollToBottom />
          <Composer />
        </div>
      </ThreadPrimitive.Viewport>
    </ThreadPrimitive.Root>
  );
};

const ThreadTitleGenerator: FC = () => {
  const runtime = useAssistantRuntime();
  const messages = useThread((t) => t.messages);
  const threadId = useThread((t) => t.threadId);
  const generatedRef = useRef(new Set<string>());

  useEffect(() => {
    if (!runtime) return;
    const threadItem = runtime.threads.mainItem;
    const title = threadItem.getState().title;
    if (messages.length > 0 && !title && !generatedRef.current.has(threadId)) {
      generatedRef.current.add(threadId);
      const userMessages = messages
        .filter((m) => m.role === "user")
        .map((m) =>
          m.content
            .filter((c) => c.type === "text")
            .map((c) => (c as TextContentPart).text)
            .join(" ")
        );
      fetch("/api/thread-name", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: userMessages }),
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.title) {
            const title = data.title
              .trim()
              .replace(/^['"]|['"]$/g, "")
              .split(/\s+/)
              .slice(0, 5)
              .join(" ");
            threadItem.rename(title);
          }
        })
        .catch((err) => console.error("Failed to generate thread title", err));
    }
  }, [runtime, messages, threadId]);

  return null;
};

const ThreadScrollToBottom: FC = () => {
  return (
    <ThreadPrimitive.ScrollToBottom asChild>
      <TooltipIconButton
        tooltip="Scroll to bottom"
        variant="outline"
        className="absolute -top-8 rounded-full disabled:invisible"
      >
        <ArrowDownIcon />
      </TooltipIconButton>
    </ThreadPrimitive.ScrollToBottom>
  );
};

const ThreadWelcome: FC = () => {
  return (
    <ThreadPrimitive.Empty>
      <div className="flex w-full max-w-[var(--thread-max-width)] flex-grow flex-col">
        <div className="flex w-full flex-grow flex-col items-center justify-center">
          <Image
            src="/purple-pup.png"
            alt="Friendly dog mascot"
            width={300}
            height={300}
          />
        </div>
        <ThreadWelcomeSuggestions />
      </div>
    </ThreadPrimitive.Empty>
  );
};

const ThreadWelcomeSuggestions: FC = () => {
  const rows = [];
  for (let i = 0; i < suggestedQuestions.length; i += 2) {
    rows.push(suggestedQuestions.slice(i, i + 2));
  }
  return (
    <div className="mt-3 flex w-full flex-col gap-4">
      {rows.map((row, rowIdx) => (
        <div
          key={rowIdx}
          className="flex items-stretch justify-center gap-4 w-full"
        >
          {row.map((question) => (
            <ThreadPrimitive.Suggestion
              key={question}
              className="hover:bg-muted/80 flex max-w-sm grow basis-0 flex-col items-center justify-center rounded-lg border p-3 transition-colors ease-in"
              prompt={question}
              method="replace"
              autoSend
            >
              <span className="line-clamp-2 text-ellipsis text-sm font-semibold">
                {question}
              </span>
            </ThreadPrimitive.Suggestion>
          ))}
        </div>
      ))}
    </div>
  );
};

const Composer: FC = () => {
  return (
    <ComposerPrimitive.Root className="focus-within:border-ring/20 flex w-full flex-wrap items-end rounded-lg border bg-inherit px-2.5 shadow-sm transition-colors ease-in">
      <ComposerPrimitive.Input
        rows={1}
        autoFocus
        placeholder="Write a message..."
        className="placeholder:text-muted-foreground max-h-40 flex-grow resize-none border-none bg-transparent px-2 py-4 text-sm outline-none focus:ring-0 disabled:cursor-not-allowed"
      />
      <ComposerAction />
    </ComposerPrimitive.Root>
  );
};

const ComposerAction: FC = () => {
  const composerRuntime = useComposerRuntime();
  const [listening, setListening] = useState(false);

  interface SpeechRecognitionEvent {
    results: Array<{ 0: { transcript: string } }>;
  }

  interface SpeechRecognitionInstance {
    lang: string;
    start: () => void;
    stop: () => void;
    onresult: ((event: SpeechRecognitionEvent) => void) | null;
    onend: (() => void) | null;
  }

  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);

  const startListening = () => {
    const SpeechRecognitionConstructor =
      (
        window as unknown as {
          SpeechRecognition?: new () => SpeechRecognitionInstance;
          webkitSpeechRecognition?: new () => SpeechRecognitionInstance;
        }
      ).SpeechRecognition ||
      (
        window as unknown as {
          SpeechRecognition?: new () => SpeechRecognitionInstance;
          webkitSpeechRecognition?: new () => SpeechRecognitionInstance;
        }
      ).webkitSpeechRecognition;

    if (!SpeechRecognitionConstructor) return;

    const recognition = new SpeechRecognitionConstructor();
    recognition.lang = "en-US";
    recognition.onresult = (event: SpeechRecognitionEvent) => {
      const transcript = Array.from(event.results)
        .map((r) => r[0].transcript)
        .join(" ");
      const prev = composerRuntime.getState().text;
      composerRuntime.setText(`${prev ? prev + " " : ""}${transcript}`.trim());
    };
    recognition.onend = () => setListening(false);
    recognition.start();
    recognitionRef.current = recognition;
    setListening(true);
  };

  const stopListening = () => {
    recognitionRef.current?.stop();
    setListening(false);
  };

  return (
    <>
      <TooltipIconButton
        tooltip={listening ? "Stop recording" : "Start recording"}
        variant="outline"
        onClick={listening ? stopListening : startListening}
        className={cn(
          "my-2.5 size-8 p-2 transition-opacity ease-in",
          listening && "text-red-500"
        )}
      >
        {listening ? <SquareIcon /> : <MicIcon />}
      </TooltipIconButton>

      <ThreadPrimitive.If running={false}>
        <ComposerPrimitive.Send asChild>
          <TooltipIconButton
            tooltip="Send"
            variant="default"
            className="my-2.5 size-8 p-2 transition-opacity ease-in"
          >
            <SendHorizontalIcon />
          </TooltipIconButton>
        </ComposerPrimitive.Send>
      </ThreadPrimitive.If>
      <ThreadPrimitive.If running>
        <ComposerPrimitive.Cancel asChild>
          <TooltipIconButton
            tooltip="Cancel"
            variant="default"
            className="my-2.5 size-8 p-2 transition-opacity ease-in"
          >
            <CircleStopIcon />
          </TooltipIconButton>
        </ComposerPrimitive.Cancel>
      </ThreadPrimitive.If>
    </>
  );
};

const UserMessage: FC = () => {
  const { initials } = useUserInitials();

  return (
    <MessagePrimitive.Root className="grid auto-rows-auto grid-cols-[minmax(72px,1fr)_auto_auto] gap-y-2 [&:where(>*)]:col-start-2 w-full max-w-[var(--thread-max-width)] py-4">
      <UserActionBar />

      <div className="bg-background border text-foreground max-w-[calc(var(--thread-max-width)*0.8)] break-words rounded-3xl px-5 py-2.5 col-start-2 row-start-2">
        <MessagePrimitive.Content />
      </div>

      <div className="col-start-3 row-start-1 row-span-2 ml-3 flex h-10 w-10 items-center justify-center rounded-full bg-white text-purple-700 text-sm font-medium">
        {initials}
      </div>

      <BranchPicker className="col-span-full col-start-1 row-start-3 -mr-1 justify-end" />
    </MessagePrimitive.Root>
  );
};

const UserActionBar: FC = () => {
  return (
    <ActionBarPrimitive.Root
      hideWhenRunning
      autohide="not-last"
      className="flex flex-col items-end col-start-1 row-start-2 mr-3 mt-2.5"
    >
      <ActionBarPrimitive.Edit asChild>
        <TooltipIconButton tooltip="Edit">
          <PencilIcon />
        </TooltipIconButton>
      </ActionBarPrimitive.Edit>
    </ActionBarPrimitive.Root>
  );
};

const EditComposer: FC = () => {
  return (
    <ComposerPrimitive.Root className="bg-muted my-4 flex w-full max-w-[var(--thread-max-width)] flex-col gap-2 rounded-xl">
      <ComposerPrimitive.Input className="text-foreground flex h-8 w-full resize-none bg-transparent p-4 pb-0 outline-none" />

      <div className="mx-3 mb-3 flex items-center justify-center gap-2 self-end">
        <ComposerPrimitive.Cancel asChild>
          <Button variant="ghost">Cancel</Button>
        </ComposerPrimitive.Cancel>
        <ComposerPrimitive.Send asChild>
          <Button>Send</Button>
        </ComposerPrimitive.Send>
      </div>
    </ComposerPrimitive.Root>
  );
};

const AssistantMessage: FC = () => {
  const text = useMessage((m) =>
    m.content
      .filter((part): part is TextContentPart => part.type === "text")
      .map((part) => part.text)
      .join("\n\n")
  );

  const chartData = useMemo(() => {
    if (!text) return [];
    const resultsSection = text.split("### Results")[1];
    if (!resultsSection) return [];
    const tableMatch = resultsSection.match(/((?:\|.*\|\n)+)/);
    if (!tableMatch) return [];
    const lines = tableMatch[1]
      .trim()
      .split("\n")
      .filter((line) => line.trim().startsWith("|"));
    if (lines.length < 2) return [];
    const headers = lines[0]
      .split("|")
      .slice(1, -1)
      .map((h) => h.trim());
    const rows = lines.slice(2).map((line) =>
      line
        .split("|")
        .slice(1, -1)
        .map((cell) => cell.trim())
    );
    if (!rows.length) return [];
    const numColIndex = headers.findIndex((_, idx) =>
      rows.some((row) => !isNaN(Number(row[idx].replace(/,/g, ""))))
    );
    if (numColIndex === -1) return [];
    const labelIndex = numColIndex === 0 ? 1 : 0;
    return rows.slice(0, 10).map((row) => ({
      label: row[labelIndex],
      value: Number(row[numColIndex].replace(/,/g, "")),
    }));
  }, [text]);

  return (
    <MessagePrimitive.Root className="grid grid-cols-[auto_auto_1fr] grid-rows-[auto_1fr] relative w-full max-w-[var(--thread-max-width)] py-4">
      <Image
        src="/purple-pup-avatar.png"
        alt="AI avatar"
        width={40}
        height={40}
        className="col-start-1 row-start-1 row-span-2 mr-3 rounded-full"
      />
      <div className="bg-muted text-foreground max-w-[calc(var(--thread-max-width)*0.8)] break-words leading-7 col-span-2 col-start-2 row-start-1 my-1.5 rounded-3xl px-5 py-2.5">
        <MessagePrimitive.Content components={{ Text: MarkdownText }} />
        {chartData.length > 0 && (
          <div className="mt-4">
            <BarChart data={chartData} />
          </div>
        )}
      </div>

      <AssistantActionBar />

      <BranchPicker className="col-start-2 row-start-2 -ml-2 mr-2" />
    </MessagePrimitive.Root>
  );
};

const AssistantActionBar: FC = () => {
  return (
    <ActionBarPrimitive.Root
      hideWhenRunning
      autohide="not-last"
      autohideFloat="single-branch"
      className="text-muted-foreground flex gap-1 col-start-3 row-start-2 -ml-1 data-[floating]:bg-background data-[floating]:absolute data-[floating]:rounded-md data-[floating]:border data-[floating]:p-1 data-[floating]:shadow-sm"
    >
      <ActionBarPrimitive.Copy asChild>
        <TooltipIconButton tooltip="Copy">
          <MessagePrimitive.If copied>
            <CheckIcon />
          </MessagePrimitive.If>
          <MessagePrimitive.If copied={false}>
            <CopyIcon />
          </MessagePrimitive.If>
        </TooltipIconButton>
      </ActionBarPrimitive.Copy>
      <ActionBarPrimitive.Reload asChild>
        <TooltipIconButton tooltip="Refresh">
          <RefreshCwIcon />
        </TooltipIconButton>
      </ActionBarPrimitive.Reload>
    </ActionBarPrimitive.Root>
  );
};

const BranchPicker: FC<BranchPickerPrimitive.Root.Props> = ({
  className,
  ...rest
}) => {
  return (
    <BranchPickerPrimitive.Root
      hideWhenSingleBranch
      className={cn(
        "text-muted-foreground inline-flex items-center text-xs",
        className
      )}
      {...rest}
    >
      <BranchPickerPrimitive.Previous asChild>
        <TooltipIconButton tooltip="Previous">
          <ChevronLeftIcon />
        </TooltipIconButton>
      </BranchPickerPrimitive.Previous>
      <span className="font-medium">
        <BranchPickerPrimitive.Number /> / <BranchPickerPrimitive.Count />
      </span>
      <BranchPickerPrimitive.Next asChild>
        <TooltipIconButton tooltip="Next">
          <ChevronRightIcon />
        </TooltipIconButton>
      </BranchPickerPrimitive.Next>
    </BranchPickerPrimitive.Root>
  );
};

const CircleStopIcon = () => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 16 16"
      fill="currentColor"
      width="16"
      height="16"
    >
      <rect width="10" height="10" x="3" y="3" rx="2" />
    </svg>
  );
};
