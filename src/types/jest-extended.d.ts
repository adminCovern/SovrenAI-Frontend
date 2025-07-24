/// <reference types="jest" />

declare global {
  namespace jest {
    interface Matchers<R> {
      toBeInTheDocument(): R;
      toHaveClass(className: string): R;
      toHaveAttribute(attr: string, value?: string): R;
      toBe(value: any): R;
      toBeDefined(): R;
      toBeGreaterThan(value: number): R;
      toHaveBeenCalled(): R;
      toHaveBeenCalledWith(...args: any[]): R;
      toHaveBeenCalledTimes(times: number): R;
      not: Matchers<R>;
    }
  }

  var describe: (name: string, fn: () => void) => void;
  var test: (name: string, fn: () => void) => void;
  var it: (name: string, fn: () => void) => void;
  var expect: {
    (actual: any): jest.Matchers<any>;
    any(type: any): any;
  } & {
    any(type: any): any;
  };
  var beforeEach: (fn: () => void) => void;
  var afterEach: (fn: () => void) => void;
  var beforeAll: (fn: () => void) => void;
  var afterAll: (fn: () => void) => void;
  var jest: {
    fn(): jest.Mock;
    clearAllMocks(): void;
    useFakeTimers(): void;
    useRealTimers(): void;
    advanceTimersByTime(msToRun: number): void;
  };
  var global: {
    WebSocket: any;
  };
}

export {} 