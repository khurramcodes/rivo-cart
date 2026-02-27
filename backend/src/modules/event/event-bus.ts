export type AppEventName =
  | "QUESTION_CREATED"
  | "ANSWER_CREATED"
  | "REVIEW_CREATED"
  | "REVIEW_APPROVED"
  | "REVIEW_REJECTED"
  | "REPORT_CREATED";

export type EventPayloadMap = {
  QUESTION_CREATED: {
    questionId: string;
    userId: string;
    userName: string;
    productId: string;
    questionText: string;
  };
  ANSWER_CREATED: {
    answerId: string;
    questionId: string;
    questionOwnerUserId: string;
    questionOwnerEmail?: string;
    questionText: string;
    answerText: string;
  };
  REVIEW_CREATED: { reviewId: string; userId: string; productId: string; rating: number };
  REVIEW_APPROVED: { reviewId: string; productId: string; approvedBy: string };
  REVIEW_REJECTED: { reviewId: string; productId: string; rejectedBy: string };
  REPORT_CREATED: {
    reportId: string;
    targetType: "QUESTION" | "ANSWER" | "REVIEW";
    targetId: string;
    reason: "OFF_TOPIC" | "INAPPROPRIATE" | "FAKE" | "MISLEADING";
    reporterId: string;
  };
};

type EventHandler<K extends AppEventName> = (payload: EventPayloadMap[K]) => Promise<void> | void;

const handlers: { [K in AppEventName]: EventHandler<K>[] } = {
  QUESTION_CREATED: [],
  ANSWER_CREATED: [],
  REVIEW_CREATED: [],
  REVIEW_APPROVED: [],
  REVIEW_REJECTED: [],
  REPORT_CREATED: [],
};

export function registerHandler<K extends AppEventName>(eventName: K, handler: EventHandler<K>) {
  handlers[eventName].push(handler as EventHandler<any>);
}

export async function emitEvent<K extends AppEventName>(eventName: K, payload: EventPayloadMap[K]) {
  const eventHandlers = handlers[eventName];
  if (eventHandlers.length === 0) return;

  const settled = await Promise.allSettled(
    eventHandlers.map((handler) => Promise.resolve(handler(payload as any))),
  );

  for (const result of settled) {
    if (result.status === "rejected") {
      // Events should never break core business flow.
      console.error(`[event-bus] handler failed for ${eventName}:`, result.reason);
    }
  }
}
