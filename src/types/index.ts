export interface ILayout {
  userId: string;
  name: string;
  isLocal: boolean;
  stream: MediaStream | null;
}
