export interface DiagnosticErrorRecord {
  id: string;
  source?: string;
  type?: string;
  message: string;
  details?: unknown;
  timestamp: Date | string;
  category?: string;
  suggestion?: string;
  code?: string;
}

export interface DiagnosticNetworkRequest {
  id?: string;
  url?: string;
  method?: string;
  status: number | 'pending' | 'error' | 'timeout';
  statusText?: string;
  duration?: number;
  timestamp?: Date | string;
}

export interface DiagnosticWebSocket {
  type: string;
  status: string;
  url?: string;
  error?: string;
}

interface DiagnosticPerformanceMetrics {
  api?: Array<{ url?: string; duration: number; method?: string; status?: number }>;
  pageLoad?: {
    total: number;
    domContentLoaded: number;
    loaded: number;
    interactive: number;
    domComplete: number;
  };
  resource?: Array<{ duration: number }>;
  [key: string]: unknown;
}

interface DiagnosticResourceUsage {
  memory?: {
    used?: number;
    total?: number;
    limit?: number;
  };
}

declare class DiagnosticService {
  startCapturing(): void;
  stopCapturing(): void;
  getErrors(): DiagnosticErrorRecord[];
  subscribe(listener: (errors: DiagnosticErrorRecord[]) => void): () => void;
  clearErrors(): void;
  getNetworkRequests(): DiagnosticNetworkRequest[];
  subscribeToNetworkActivity(listener: (requests: DiagnosticNetworkRequest[]) => void): () => void;
  getPerformanceMetrics(): DiagnosticPerformanceMetrics;
  getEnvironmentInfo(): Record<string, unknown>;
  getResourceUsage(): DiagnosticResourceUsage;
  getLocalStorageItems(): Record<string, string>;
  getSessionStorageItems(): Record<string, string>;
  getCookies(): Record<string, string>;
  getWebSocketStatus(): DiagnosticWebSocket[];
  exportDiagnosticData(): unknown;
  injectTestError(errorType: string): void;
}

declare const diagnosticService: DiagnosticService;

export { diagnosticService };
export default diagnosticService;
