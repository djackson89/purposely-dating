export interface QotdItem {
  question: string;
  angle: string;
  tags: string[];
  follow_ups?: string[];
  depth_score: number;
}
