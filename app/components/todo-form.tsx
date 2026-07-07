"use client";

import { useMemo, useRef, useState, useTransition } from "react";

type SpeechRecognitionConstructor = new () => SpeechRecognition;

type SpeechRecognition = {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: (() => void) | null;
  onend: (() => void) | null;
  start: () => void;
};

type SpeechRecognitionEvent = {
  results: ArrayLike<{ 0: { transcript: string } }>;
};

type SpeechWindow = Window & {
  SpeechRecognition?: SpeechRecognitionConstructor;
  webkitSpeechRecognition?: SpeechRecognitionConstructor;
};

type TodoFormProps = {
  action: (formData: FormData) => void | Promise<void>;
};

const bucketLabels = {
  today: "오늘",
  tomorrow: "내일",
  week: "이번 주",
} as const;

type Bucket = keyof typeof bucketLabels;

function inferBucket(transcript: string): { bucket: Bucket; title: string } {
  const normalized = transcript.trim();

  if (/이번\s*주|이번주|주중|주말/.test(normalized)) {
    return { bucket: "week", title: normalized.replace(/이번\s*주|이번주|주중|주말/g, "").trim() || normalized };
  }

  if (/내일/.test(normalized)) {
    return { bucket: "tomorrow", title: normalized.replace(/내일/g, "").trim() || normalized };
  }

  if (/오늘/.test(normalized)) {
    return { bucket: "today", title: normalized.replace(/오늘/g, "").trim() || normalized };
  }

  return { bucket: "today", title: normalized };
}

export function TodoForm({ action }: TodoFormProps) {
  const [title, setTitle] = useState("");
  const [bucket, setBucket] = useState<Bucket>("today");
  const [voiceMessage, setVoiceMessage] = useState("모바일에서는 마이크 버튼으로 말해서 추가할 수 있어요.");
  const [isListening, setIsListening] = useState(false);
  const [isPending, startTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);

  const isSpeechSupported = useMemo(() => {
    if (typeof window === "undefined") return false;
    const speechWindow = window as SpeechWindow;
    return Boolean(speechWindow.SpeechRecognition || speechWindow.webkitSpeechRecognition);
  }, []);

  function startVoiceInput() {
    const speechWindow = window as SpeechWindow;
    const SpeechRecognition = speechWindow.SpeechRecognition || speechWindow.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setVoiceMessage("이 브라우저는 음성 입력을 지원하지 않아요. Chrome 모바일에서 다시 시도해 주세요.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = "ko-KR";
    recognition.continuous = false;
    recognition.interimResults = false;
    setIsListening(true);
    setVoiceMessage("듣고 있어요. 예: ‘내일 병원 예약’처럼 말해 주세요.");

    recognition.onresult = (event) => {
      const transcript = event.results[0]?.[0]?.transcript ?? "";
      const parsed = inferBucket(transcript);
      setBucket(parsed.bucket);
      setTitle(parsed.title);
      setVoiceMessage(`인식됨: ${bucketLabels[parsed.bucket]} · ${parsed.title}`);
    };

    recognition.onerror = () => {
      setVoiceMessage("음성 인식 중 문제가 생겼어요. 다시 눌러서 시도해 주세요.");
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.start();
  }

  function handleSubmit(formData: FormData) {
    startTransition(async () => {
      await action(formData);
      setTitle("");
      formRef.current?.reset();
      setBucket("today");
    });
  }

  return (
    <form ref={formRef} className="todo-form" action={handleSubmit}>
      <div className="form-title-row">
        <label htmlFor="title">New todo</label>
        <p className="voice-hint">{voiceMessage}</p>
      </div>

      <div className="inline-form-row enhanced">
        <select aria-label="When" name="due_bucket" value={bucket} onChange={(event) => setBucket(event.target.value as Bucket)}>
          <option value="today">오늘</option>
          <option value="tomorrow">내일</option>
          <option value="week">이번 주</option>
        </select>

        <input
          id="title"
          name="title"
          type="text"
          required
          maxLength={160}
          placeholder="Add a task..."
          value={title}
          onChange={(event) => setTitle(event.target.value)}
        />

        <button className="voice-button" type="button" onClick={startVoiceInput} disabled={isListening || !isSpeechSupported}>
          {isListening ? "듣는 중" : "말하기"}
        </button>

        <button type="submit" disabled={isPending}>{isPending ? "Adding" : "Add"}</button>
      </div>
    </form>
  );
}
