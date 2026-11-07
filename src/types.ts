export interface Language {
    id: string;
    name: string;
    ext: string;
  }
  
  export interface Stats {
    before: number;
    after: number;
    saved: number;
    percent: number;
    commentsRemoved: number;
    linesRemoved: number;
    blocksRemoved: number;
  }
  
  export interface RemoveResponse {
    result: string;
    stats: Stats;
  }
  
  export interface BatchFile {
    name: string;
    content: string;
  }
  
  export interface BatchProcessedFile {
    name: string;
    language?: string;
    result?: string;
    stats?: Stats;
    error?: string;
    skipped?: boolean;
    reason?: string;
  }
  
  export interface BatchResponse {
    files: BatchProcessedFile[];
    summary: {
      total: number;
      processed: number;
      totalSaved: number;
    };
  }
  
  export type ToastKind = 'default' | 'success' | 'error';
  
  export interface ToastOptions {
    kind?: ToastKind;
    duration?: number;
  }
  
  export interface DiffSegment {
    op: 0 | 1 | -1;
    text: string;
  }
  
  export type Theme = 'dark' | 'light';