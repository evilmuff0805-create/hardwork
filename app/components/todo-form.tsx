"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";

type SpeechRecognitionConstructor = new () => SpeechRecognition;

type SpeechRecognition = {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
  abort: () => void;
};

type SpeechRecognitionResult = ArrayLike<{ transcript: string }> & { isFinal: boolean };

type SpeechRecognitionEvent = {
  results: ArrayLike<SpeechRecognitionResult>;
};

type SpeechRecognitionErrorEvent = {
  error: string;
};

type SpeechWindow = Window & {
  SpeechRecognition?: SpeechRecognitionConstructor;
  webkitSpeechRecognition?: SpeechRecognitionConstructor;
};

type TodoFormProps = {
  action: (formData: FormData) => void | Promise<void>;
};

type ParsedSchedule = {
  dueDate: string;
  title: string;
  message: string;
};

const dayNames = ["일", "월", "화", "수", "목", "금", "토"] as const;

// How long the mic waits through silence before it turns itself off.
const silenceLimitMs = 5000;

const weekdayPatterns = [
  { day: 0, pattern: /일요일|일욜/g },
  { day: 1, pattern: /월요일|월욜/g },
  { day: 2, pattern: /화요일|화욜/g },
  { day: 3, pattern: /수요일|수욜/g },
  { day: 4, pattern: /목요일|목욜/g },
  { day: 5, pattern: /금요일|금욜/g },
  { day: 6, pattern: /토요일|토욜/g },
];

function toDateInputValue(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function addDays(date: Date, days: number) {
  const nextDate = new Date(date);
  nextDate.setDate(nextDate.getDate() + days);
  return nextDate;
}

function nextWeekdayDate(today: Date, targetDay: number) {
  const currentDay = today.getDay();
  const daysUntilTarget = (targetDay - currentDay + 7) % 7 || 7;
  return addDays(today, daysUntilTarget);
}

function stripScheduleWords(title: string, pattern: RegExp) {
  return title.replace(pattern, "").replace(/에\s*/g, " ").replace(/\s+/g, " ").trim();
}

function parseSchedule(transcript: string): ParsedSchedule {
  const today = new Date();
  const normalized = transcript.trim();

  if (/모레/.test(normalized)) {
    const dueDate = addDays(today, 2);
    return { dueDate: toDateInputValue(dueDate), title: stripScheduleWords(normalized, /모레/g) || normalized, message: "모레" };
  }

  if (/내일/.test(normalized)) {
    const dueDate = addDays(today, 1);
    return { dueDate: toDateInputValue(dueDate), title: stripScheduleWords(normalized, /내일/g) || normalized, message: "내일" };
  }

  if (/오늘/.test(normalized)) {
    return { dueDate: toDateInputValue(today), title: stripScheduleWords(normalized, /오늘/g) || normalized, message: "오늘" };
  }

  for (const weekday of weekdayPatterns) {
    if (weekday.pattern.test(normalized)) {
      weekday.pattern.lastIndex = 0;
      const dueDate = nextWeekdayDate(today, weekday.day);
      return {
        dueDate: toDateInputValue(dueDate),
        title: stripScheduleWords(normalized, weekday.pattern) || normalized,
        message: `${dayNames[weekday.day]}요일`,
      };
    }
  }

  return { dueDate: toDateInputValue(today), title: normalized, message: "오늘" };
}

// A restarted recognition session starts a new phrase, so the pieces need a
// separator of their own instead of being glued together.
function joinSpeech(...parts: string[]) {
  return parts.map((part) => part.trim()).filter(Boolean).join(" ");
}

function formatDateLabel(dateValue: string) {
  const date = new Date(`${dateValue}T00:00:00`);
  return `${date.getMonth() + 1}/${date.getDate()} (${dayNames[date.getDay()]})`;
}

export function TodoForm({ action }: TodoFormProps) {
  const initialDueDate = useMemo(() => toDateInputValue(new Date()), []);
  const [title, setTitle] = useState("");
  const [dueDate, setDueDate] = useState(initialDueDate);
  const [voiceMessage, setVoiceMessage] = useState("말하기 버튼으로 ‘금요일에 점심 식사’처럼 추가할 수 있어요.");
  const [isListening, setIsListening] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(silenceLimitMs / 1000);
  const [isPending, startTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);

  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const keepListeningRef = useRef(false);
  // Text finalized by earlier recognition sessions. The browser ends a session on
  // its own during a pause, so we restart it and keep this across restarts.
  const committedTextRef = useRef("");
  const sessionTextRef = useRef("");
  const hadErrorRef = useRef(false);
  const deadlineRef = useRef(0);
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  function stopCountdown() {
    if (countdownRef.current) {
      clearInterval(countdownRef.current);
      countdownRef.current = null;
    }
  }

  function extendSilenceDeadline() {
    deadlineRef.current = Date.now() + silenceLimitMs;
  }

  useEffect(() => {
    return () => {
      keepListeningRef.current = false;
      if (countdownRef.current) clearInterval(countdownRef.current);
      recognitionRef.current?.abort();
    };
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
    recognition.continuous = true;
    recognition.interimResults = true;

    recognitionRef.current = recognition;
    keepListeningRef.current = true;
    committedTextRef.current = "";
    sessionTextRef.current = "";
    hadErrorRef.current = false;
    setTitle("");
    setIsListening(true);
    setSecondsLeft(silenceLimitMs / 1000);
    setVoiceMessage("듣고 있어요. 천천히 말해도 괜찮아요.");

    extendSilenceDeadline();
    stopCountdown();
    countdownRef.current = setInterval(() => {
      const remainingMs = deadlineRef.current - Date.now();
      setSecondsLeft(Math.max(0, Math.ceil(remainingMs / 1000)));
      if (remainingMs <= 0) {
        keepListeningRef.current = false;
        stopCountdown();
        recognition.stop();
      }
    }, 250);

    recognition.onresult = (event) => {
      let finalText = "";
      let interimText = "";

      for (let index = 0; index < event.results.length; index += 1) {
        const result = event.results[index];
        const transcript = result[0]?.transcript ?? "";
        if (result.isFinal) finalText += transcript;
        else interimText += transcript;
      }

      sessionTextRef.current = finalText;
      setTitle(joinSpeech(committedTextRef.current, finalText, interimText));
      extendSilenceDeadline();
    };

    recognition.onerror = (event) => {
      // The browser reports these while the user is simply pausing, so keep waiting
      // and let our own silence timer decide when to stop.
      if (event.error === "no-speech" || event.error === "aborted") return;

      keepListeningRef.current = false;
      hadErrorRef.current = true;
      stopCountdown();
      setVoiceMessage(
        event.error === "not-allowed" || event.error === "service-not-allowed"
          ? "마이크 사용이 차단돼 있어요. 브라우저 주소창의 자물쇠 아이콘에서 마이크를 허용해 주세요."
          : "음성 인식 중 문제가 생겼어요. 다시 눌러서 시도해 주세요.",
      );
    };

    recognition.onend = () => {
      committedTextRef.current = joinSpeech(committedTextRef.current, sessionTextRef.current);
      sessionTextRef.current = "";

      if (keepListeningRef.current) {
        try {
          recognition.start();
          return;
        } catch {
          // Restart refused, so finish with what we already heard.
        }
      }

      stopCountdown();
      recognitionRef.current = null;
      setIsListening(false);
      // On a real error the message is already set, so keep it.
      if (!hadErrorRef.current) finishVoiceInput(committedTextRef.current);
    };

    recognition.start();
  }

  function stopVoiceInput() {
    keepListeningRef.current = false;
    stopCountdown();
    recognitionRef.current?.stop();
  }

  function finishVoiceInput(transcript: string) {
    const spoken = transcript.trim();

    if (!spoken) {
      setVoiceMessage("아무 말도 못 들었어요. 다시 눌러서 말해 주세요.");
      return;
    }

    const parsed = parseSchedule(spoken);
    setDueDate(parsed.dueDate);
    setTitle(parsed.title);
    setVoiceMessage(`인식됨: ${parsed.message} · ${parsed.title}`);
  }

  function handleSubmit(formData: FormData) {
    startTransition(async () => {
      await action(formData);
      setTitle("");
      setDueDate(initialDueDate);
      formRef.current?.reset();
    });
  }

  return (
    <form ref={formRef} className="todo-form" action={handleSubmit}>
      <div className="form-title-row">
        <label htmlFor="title">새 할 일</label>
        <p className="voice-hint">
          {isListening ? `듣고 있어요. ${secondsLeft}초 더 조용하면 자동으로 꺼져요.` : voiceMessage}
        </p>
      </div>

      <div className="inline-form-row enhanced">
        <label className="date-pill" htmlFor="due_date">
          <span>날짜</span>
          <input id="due_date" name="due_date" type="date" value={dueDate} onChange={(event) => setDueDate(event.target.value)} />
        </label>

        <input
          id="title"
          name="title"
          type="text"
          required
          maxLength={160}
          placeholder="예: 금요일에 점심 식사"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
        />

        <button
          className={isListening ? "voice-button listening" : "voice-button"}
          type="button"
          onClick={isListening ? stopVoiceInput : startVoiceInput}
        >
          {isListening ? "그만 듣기" : "말하기"}
        </button>

        <button type="submit" disabled={isPending}>{isPending ? "추가 중" : "추가"}</button>
      </div>

      <p className="selected-date">선택된 날짜: {formatDateLabel(dueDate)}</p>
    </form>
  );
}

