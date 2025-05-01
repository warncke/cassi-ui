export interface FileData {
  id: string;
  name: string;
  content: string;
}

export interface Diff {
  id: string;
  filename: string;
  original: string;
  modified: string;
}