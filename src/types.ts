export interface AnswerEntry {
  value?: string | string[];
  details?: string;
}

export type Answers = Record<string, AnswerEntry>;

export interface ContactInfo {
  name: string;
  email: string;
  phone: string;
}
