import { apiClient } from "./apiClient";
import type { Question, Answer } from "@/types";

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

  async reportQuestion(questionId: string, reason: string) {
    await apiClient.post(`/qa/questions/${questionId}/report`, { reason });
  },

  async markAnswerHelpful(answerId: string) {
    await apiClient.put(`/qa/answers/${answerId}/helpful`, {});
  },

  async myAnswerHelpful(answerId: string) {
    const { data } = await apiClient.get<{ helpful: boolean }>(`/qa/answers/${answerId}/helpful`);
    return data.helpful;
  },

  async reportAnswer(answerId: string, reason: string) {
    await apiClient.post(`/qa/answers/${answerId}/report`, { reason });
  },
};
