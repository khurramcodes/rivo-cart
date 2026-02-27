import { apiClient } from "./apiClient";
import type { Question, Answer, ReportReason } from "@/types";

export const qaApi = {
  async listQuestions(productId: string, params?: { page?: number; limit?: number }) {
    const { data } = await apiClient.get<{ items: Question[]; total: number; page: number; limit: number }>(
      `/products/${productId}/questions`,
      { params },
    );
    return data;
  },

  async createQuestion(productId: string, question: string) {
    const { data } = await apiClient.post<{ question: Question }>(`/products/${productId}/questions`, { question });
    return data.question;
  },

  async reportQuestion(questionId: string, reason: ReportReason) {
    await apiClient.post("/reports", {
      targetType: "QUESTION",
      targetId: questionId,
      reason,
    });
  },

  async setAnswerHelpful(answerId: string, helpful: boolean) {
    await apiClient.put(`/qa/answers/${answerId}/helpful`, { helpful });
  },

  async myAnswerHelpful(answerId: string) {
    const { data } = await apiClient.get<{ helpful: boolean }>(`/qa/answers/${answerId}/helpful`);
    return data.helpful;
  },

  async myQuestionReported(questionId: string) {
    const { data } = await apiClient.get<{ reported: boolean }>("/reports/my-status", {
      params: { targetType: "QUESTION", targetId: questionId },
    });
    return data.reported;
  },

  async myAnswerReported(answerId: string) {
    const { data } = await apiClient.get<{ reported: boolean }>("/reports/my-status", {
      params: { targetType: "ANSWER", targetId: answerId },
    });
    return data.reported;
  },

  async reportAnswer(answerId: string, reason: ReportReason) {
    await apiClient.post("/reports", {
      targetType: "ANSWER",
      targetId: answerId,
      reason,
    });
  },
};
