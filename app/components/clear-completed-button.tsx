"use client";

import { useState, useTransition } from "react";

type ClearCompletedButtonProps = {
  action: () => void | Promise<void>;
  count: number;
};

export function ClearCompletedButton({ action, count }: ClearCompletedButtonProps) {
  const [isArmed, setIsArmed] = useState(false);
  const [isPending, startTransition] = useTransition();

  if (!isArmed) {
    return (
      <button className="clear-button" type="button" onClick={() => setIsArmed(true)}>
        모두 지우기
      </button>
    );
  }

  return (
    <form
      className="clear-confirm"
      action={() => {
        startTransition(async () => {
          await action();
        });
      }}
    >
      <p>{count}개를 영구 삭제할까요? 되돌릴 수 없어요.</p>
      <div className="clear-confirm-actions">
        <button className="clear-button confirm" type="submit" disabled={isPending}>
          {isPending ? "지우는 중" : "네, 지울게요"}
        </button>
        <button className="clear-button cancel" type="button" onClick={() => setIsArmed(false)} disabled={isPending}>
          취소
        </button>
      </div>
    </form>
  );
}
