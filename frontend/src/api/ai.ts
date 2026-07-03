import api from './client';

export interface ChatResponse {
  response: string;
  functionsCalled: string[];
}

export interface ChatHistoryItem {
  role: 'user' | 'model';
  content: string;
}

export const aiApi = {
  chat: (message: string, history?: ChatHistoryItem[]) =>
    api.post<ChatResponse>('/ai/chat', { message, history }).then((r) => r.data),
};
