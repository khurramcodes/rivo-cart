import { prisma } from "../prisma/client.js";
import { ApiError } from "../utils/ApiError.js";
import { emitEvent } from "../modules/event/event-bus.js";

export async function listVisibleQuestions(input: { productId: string; page?: number; limit?: number }) {
  const page = Math.max(1, input.page ?? 1);
  const limit = Math.min(50, Math.max(1, input.limit ?? 10));
  const skip = (page - 1) * limit;

  const [items, total] = await prisma.$transaction([
    prisma.question.findMany({
      where: { productId: input.productId, status: "VISIBLE" },
      include: {
        user: { select: { id: true, name: true } },
        answers: {
          where: { status: "VISIBLE" },
          include: { admin: { select: { id: true, name: true } } },
          orderBy: { createdAt: "asc" },
        },
      },
      orderBy: { createdAt: "desc" },
      take: limit,
      skip,
    }),
    prisma.question.count({ where: { productId: input.productId, status: "VISIBLE" } }),
  ]);

  return { items, total, page, limit };
}

export async function createQuestion(input: { userId: string; productId: string; question: string }) {
  const product = await prisma.product.findUnique({
    where: { id: input.productId },
    select: { id: true },
  });
  if (!product) throw new ApiError(404, "PRODUCT_NOT_FOUND", "Product not found");

  const question = await prisma.question.create({
    data: {
      productId: input.productId,
      userId: input.userId,
      question: input.question.trim(),
      status: "VISIBLE",
    },
    include: {
      user: { select: { id: true, name: true } },
      answers: true,
    },
  });
  await emitEvent("QUESTION_CREATED", {
    questionId: question.id,
    userId: input.userId,
    userName: question.user?.name ?? "Customer",
    productId: input.productId,
    questionText: input.question.trim(),
  });
  return question;
}

async function updateAnswerHelpfulCount(answerId: string) {
  const count = await prisma.answerHelpful.count({ where: { answerId } });
  await prisma.answer.update({
    where: { id: answerId },
    data: { helpfulCount: count },
  });
}

export async function setAnswerHelpful(input: { answerId: string; userId: string; helpful: boolean }) {
  const answer = await prisma.answer.findUnique({
    where: { id: input.answerId },
    select: { id: true },
  });
  if (!answer) throw new ApiError(404, "ANSWER_NOT_FOUND", "Answer not found");

  if (input.helpful) {
    await prisma.answerHelpful.upsert({
      where: {
        answerId_userId: { answerId: input.answerId, userId: input.userId },
      },
      create: {
        answerId: input.answerId,
        userId: input.userId,
      },
      update: {},
    });
  } else {
    await prisma.answerHelpful.deleteMany({
      where: {
        answerId: input.answerId,
        userId: input.userId,
      },
    });
  }

  await updateAnswerHelpfulCount(input.answerId);
}

export async function reportQuestion(input: { questionId: string; userId: string; reason: string }) {
  const question = await prisma.question.findUnique({
    where: { id: input.questionId },
    select: { id: true },
  });
  if (!question) throw new ApiError(404, "QUESTION_NOT_FOUND", "Question not found");

  try {
    await prisma.questionReport.create({
      data: {
        questionId: input.questionId,
        userId: input.userId,
        reason: input.reason.trim(),
      },
    });
  } catch (err: unknown) {
    const e = err as { code?: string };
    if (e?.code === "P2002") {
      throw new ApiError(409, "ALREADY_REPORTED", "You have already reported this question");
    }
    throw err;
  }

  const count = await prisma.questionReport.count({ where: { questionId: input.questionId } });
  await prisma.question.update({
    where: { id: input.questionId },
    data: { reportCount: count },
  });
  await emitEvent("QUESTION_REPORTED", {
    questionId: input.questionId,
    userId: input.userId,
    reason: input.reason,
  });
}

export async function reportAnswer(input: { answerId: string; userId: string; reason: string }) {
  const answer = await prisma.answer.findUnique({
    where: { id: input.answerId },
    select: { id: true },
  });
  if (!answer) throw new ApiError(404, "ANSWER_NOT_FOUND", "Answer not found");

  try {
    await prisma.answerReport.create({
      data: {
        answerId: input.answerId,
        userId: input.userId,
        reason: input.reason.trim(),
      },
    });
  } catch (err: unknown) {
    const e = err as { code?: string };
    if (e?.code === "P2002") {
      throw new ApiError(409, "ALREADY_REPORTED", "You have already reported this answer");
    }
    throw err;
  }

  const count = await prisma.answerReport.count({ where: { answerId: input.answerId } });
  await prisma.answer.update({
    where: { id: input.answerId },
    data: { reportCount: count },
  });
  await emitEvent("ANSWER_REPORTED", {
    answerId: input.answerId,
    userId: input.userId,
    reason: input.reason,
  });
}

export async function userHasMarkedAnswerHelpful(input: { userId: string; answerId: string }) {
  const h = await prisma.answerHelpful.findUnique({
    where: { answerId_userId: { answerId: input.answerId, userId: input.userId } },
  });
  return Boolean(h);
}

// Admin
export async function adminListQuestions(input: {
  productId?: string;
  status?: "VISIBLE" | "HIDDEN";
  page?: number;
  limit?: number;
}) {
  const page = Math.max(1, input.page ?? 1);
  const limit = Math.min(50, Math.max(1, input.limit ?? 20));
  const skip = (page - 1) * limit;
  const where: { productId?: string; status?: "VISIBLE" | "HIDDEN" } = {};
  if (input.productId) where.productId = input.productId;
  if (input.status) where.status = input.status;

  const [items, total] = await prisma.$transaction([
    prisma.question.findMany({
      where,
      include: {
        product: { select: { id: true, name: true } },
        user: { select: { id: true, name: true, email: true } },
        answers: {
          include: { admin: { select: { id: true, name: true } } },
        },
      },
      orderBy: { createdAt: "desc" },
      take: limit,
      skip,
    }),
    prisma.question.count({ where }),
  ]);

  return { items, total, page, limit };
}

export async function adminHideQuestion(input: { questionId: string }) {
  const q = await prisma.question.findUnique({
    where: { id: input.questionId },
    select: { id: true },
  });
  if (!q) throw new ApiError(404, "QUESTION_NOT_FOUND", "Question not found");
  await prisma.question.update({
    where: { id: input.questionId },
    data: { status: "HIDDEN" },
  });
}

export async function adminRemoveQuestion(input: { questionId: string }) {
  const q = await prisma.question.findUnique({
    where: { id: input.questionId },
    select: { id: true },
  });
  if (!q) throw new ApiError(404, "QUESTION_NOT_FOUND", "Question not found");
  await prisma.question.delete({
    where: { id: input.questionId },
  });
}

export async function adminShowQuestion(input: { questionId: string }) {
  const q = await prisma.question.findUnique({
    where: { id: input.questionId },
    select: { id: true, status: true },
  });
  if (!q) throw new ApiError(404, "QUESTION_NOT_FOUND", "Question not found");
  if (q.status !== "HIDDEN") {
    throw new ApiError(400, "QUESTION_NOT_HIDDEN", "Only hidden questions can be made visible");
  }
  await prisma.question.update({
    where: { id: input.questionId },
    data: { status: "VISIBLE" },
  });
}

export async function adminCreateAnswer(input: { questionId: string; adminId: string; answer: string }) {
  const question = await prisma.question.findUnique({
    where: { id: input.questionId },
    select: {
      id: true,
      question: true,
      userId: true,
      user: { select: { email: true } },
    },
  });
  if (!question) throw new ApiError(404, "QUESTION_NOT_FOUND", "Question not found");

  const answer = await prisma.answer.create({
    data: {
      questionId: input.questionId,
      adminId: input.adminId,
      answer: input.answer.trim(),
      status: "VISIBLE",
    },
    include: { admin: { select: { id: true, name: true } } },
  });
  await emitEvent("ANSWER_CREATED", {
    answerId: answer.id,
    questionId: input.questionId,
    questionOwnerUserId: question.userId,
    questionOwnerEmail: question.user?.email ?? undefined,
    questionText: question.question,
    answerText: input.answer.trim(),
  });
  return answer;
}

export async function adminUpdateAnswer(input: { answerId: string; adminId: string; answer: string }) {
  const existing = await prisma.answer.findUnique({
    where: { id: input.answerId },
    select: { id: true, adminId: true },
  });
  if (!existing) throw new ApiError(404, "ANSWER_NOT_FOUND", "Answer not found");
  if (existing.adminId !== input.adminId) throw new ApiError(403, "FORBIDDEN", "Not your answer");

  return prisma.answer.update({
    where: { id: input.answerId },
    data: { answer: input.answer.trim() },
    include: { admin: { select: { id: true, name: true } } },
  });
}

export async function adminHideAnswer(input: { answerId: string; adminId: string }) {
  const existing = await prisma.answer.findUnique({
    where: { id: input.answerId },
    select: { id: true, adminId: true },
  });
  if (!existing) throw new ApiError(404, "ANSWER_NOT_FOUND", "Answer not found");
  if (existing.adminId !== input.adminId) throw new ApiError(403, "FORBIDDEN", "Not your answer");
  await prisma.answer.update({
    where: { id: input.answerId },
    data: { status: "HIDDEN" },
  });
}

export async function adminRemoveAnswer(input: { answerId: string; adminId: string }) {
  const existing = await prisma.answer.findUnique({
    where: { id: input.answerId },
    select: { id: true, adminId: true },
  });
  if (!existing) throw new ApiError(404, "ANSWER_NOT_FOUND", "Answer not found");
  if (existing.adminId !== input.adminId) throw new ApiError(403, "FORBIDDEN", "Not your answer");
  await prisma.answer.delete({ where: { id: input.answerId } });
}

export async function adminShowAnswer(input: { answerId: string; adminId: string }) {
  const existing = await prisma.answer.findUnique({
    where: { id: input.answerId },
    select: { id: true, adminId: true, status: true },
  });
  if (!existing) throw new ApiError(404, "ANSWER_NOT_FOUND", "Answer not found");
  if (existing.adminId !== input.adminId) throw new ApiError(403, "FORBIDDEN", "Not your answer");
  if (existing.status !== "HIDDEN") {
    throw new ApiError(400, "ANSWER_NOT_HIDDEN", "Only hidden answers can be made visible");
  }
  await prisma.answer.update({
    where: { id: input.answerId },
    data: { status: "VISIBLE" },
  });
}
