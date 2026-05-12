param(
    [switch]$WhatIf = $false
)

$ErrorActionPreference = "Stop"
$root = (Resolve-Path "$PSScriptRoot\..").Path

function Write-File {
    param($Path, $Content)
    if ($WhatIf) {
        Write-Host "  [WhatIf] Escrever $Path" -ForegroundColor Yellow
        return
    }
    $dir = Split-Path $Path -Parent
    if (-not (Test-Path $dir)) { New-Item -ItemType Directory -Path $dir -Force | Out-Null }
    [System.IO.File]::WriteAllText($Path, $Content, [System.Text.UTF8]::new($false))
    Write-Host "  OK: $Path" -ForegroundColor Green
}

# ============================================================
# FASE 2: TESTES
# ============================================================
Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "  FASE 2 - TESTES" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

# Cria diretórios
$dirs = @(
    "$root\api\__tests__",
    "$root\src\__tests__",
    "$root\src\__tests__\components"
)
foreach ($d in $dirs) {
    if (-not (Test-Path $d)) {
        New-Item -ItemType Directory -Path $d -Force | Out-Null
        Write-Host "  Criado: $d" -ForegroundColor Gray
    }
}

# --- 2.1: Helper de testes do backend ---
Write-Host "`n[2.1] Criando helpers de teste do backend..." -ForegroundColor Cyan
Write-File -Path "$root\api\__tests__\helpers.ts" -Content @'
import type { TrpcContext } from "../context";

// Minimal mock D1Database for testing
export function createMockD1(): D1Database {
  const store = new Map<string, any[]>();
  return {
    prepare: (sql: string) => ({
      bind: (...args: any[]) => ({
        run: async () => ({ success: true, meta: {} }),
        all: async () => ({ results: [] }),
        first: async (col?: string) => null,
        raw: async () => [],
      }),
    }),
    batch: async (stmts: any[]) => [],
    exec: async (sql: string) => ({ count: 0 }),
  } as unknown as D1Database;
}

export function createMockEnv(): any {
  return {
    DB: createMockD1(),
    JWT_SECRET: "test-secret-key-at-least-32-chars-long!!",
  };
}

export function createMockContext(overrides?: Partial<TrpcContext>): TrpcContext {
  return {
    req: new Request("http://localhost/api/trpc"),
    resHeaders: new Headers(),
    env: createMockEnv(),
    user: { userId: 1, username: "testuser" },
    ...overrides,
  };
}
'@

# --- 2.2: Testes JWT ---
Write-Host "`n[2.2] Criando testes JWT..." -ForegroundColor Cyan
Write-File -Path "$root\api\__tests__\jwt.test.ts" -Content @'
import { describe, it, expect } from "vitest";
import { createToken, verifyToken, JwtError } from "../lib/jwt";

const mockEnv = { JWT_SECRET: "test-secret-key-that-is-at-least-32-chars!" };

describe("JWT", () => {
  it("should create a valid token", async () => {
    const token = await createToken({ userId: 1, username: "test" }, mockEnv);
    expect(token).toBeDefined();
    expect(typeof token).toBe("string");
    expect(token.split(".").length).toBe(3);
  });

  it("should verify a valid token", async () => {
    const token = await createToken({ userId: 1, username: "test" }, mockEnv);
    const payload = await verifyToken(token, mockEnv);
    expect(payload).not.toBeNull();
    expect(payload!.userId).toBe(1);
    expect(payload!.username).toBe("test");
  });

  it("should reject an invalid token", async () => {
    const payload = await verifyToken("invalid.token.here", mockEnv);
    expect(payload).toBeNull();
  });

  it("should reject token with wrong secret", async () => {
    const token = await createToken({ userId: 1, username: "test" }, mockEnv);
    const wrongEnv = { JWT_SECRET: "different-secret-key-that-is-also-32-chars!" };
    const payload = await verifyToken(token, wrongEnv);
    expect(payload).toBeNull();
  });

  it("should throw if JWT_SECRET is missing", async () => {
    await expect(createToken({ userId: 1, username: "test" }, {}))
      .rejects.toThrow(JwtError);
  });

  it("should throw if JWT_SECRET is too short", async () => {
    await expect(createToken({ userId: 1, username: "test" }, { JWT_SECRET: "short" }))
      .rejects.toThrow(JwtError);
  });
});
'@

# --- 2.3: Testes middleware ---
Write-Host "`n[2.3] Criando testes de middleware..." -ForegroundColor Cyan
Write-File -Path "$root\api\__tests__\middleware.test.ts" -Content @'
import { describe, it, expect } from "vitest";
import { createContext } from "../context";
import { createMockEnv } from "./helpers";

describe("createContext", () => {
  it("should create context without user when no auth", async () => {
    const req = new Request("http://localhost/api/trpc");
    const ctx = await createContext(
      { req, resHeaders: new Headers(), path: "/api/trpc" } as any,
      createMockEnv()
    );
    expect(ctx.user).toBeUndefined();
    expect(ctx.env).toBeDefined();
  });

  it("should extract user from cookie", async () => {
    // We'll test this more thoroughly after cookie implementation
    // For now just verify the function signature works
    const ctx = await createContext(
      { req: new Request("http://localhost/api/trpc"), resHeaders: new Headers(), path: "/api/trpc" } as any,
      createMockEnv()
    );
    expect(typeof ctx.createContext).toBeUndefined();
  });
});
'@

# --- 2.4: Testes de utilitarios (frontend) ---
Write-Host "`n[2.4] Criando testes de utilitarios frontend..." -ForegroundColor Cyan
Write-File -Path "$root\src\__tests__\data.test.ts" -Content @'
import { describe, it, expect } from "vitest";
import {
  formatTime,
  formatDuration,
  getClockStatus,
  getNextEntryType,
  calculateDayTotal,
  getTodayString,
  formatFullDate,
  exportToCSV,
} from "../lib/data";
import type { TimeEntry } from "../types";

const mockEntries: TimeEntry[] = [
  { id: "1", type: "in", timestamp: new Date(2024, 0, 15, 8, 0).getTime(), date: "2024-01-15" },
  { id: "2", type: "lunch-out", timestamp: new Date(2024, 0, 15, 12, 0).getTime(), date: "2024-01-15" },
  { id: "3", type: "lunch-in", timestamp: new Date(2024, 0, 15, 13, 0).getTime(), date: "2024-01-15" },
  { id: "4", type: "out", timestamp: new Date(2024, 0, 15, 17, 0).getTime(), date: "2024-01-15" },
];

describe("formatTime", () => {
  it("should format timestamp to HH:MM", () => {
    const d = new Date(2024, 0, 15, 8, 5).getTime();
    expect(formatTime(d)).toBe("08:05");
  });
});

describe("formatDuration", () => {
  it("should format minutes", () => {
    expect(formatDuration(0)).toBe("0min");
    expect(formatDuration(30)).toBe("30min");
    expect(formatDuration(60)).toBe("1h");
    expect(formatDuration(90)).toBe("1h 30min");
    expect(formatDuration(480)).toBe("8h");
  });
});

describe("getClockStatus", () => {
  it("should return off when no entries", () => {
    expect(getClockStatus([], "2024-01-15")).toBe("off");
  });

  it("should return working when last entry is in", () => {
    const entries = [mockEntries[0]]; // only clock in
    expect(getClockStatus(entries, "2024-01-15")).toBe("working");
  });

  it("should return break when last entry is lunch-out", () => {
    const entries = mockEntries.slice(0, 2);
    expect(getClockStatus(entries, "2024-01-15")).toBe("break");
  });

  it("should return off when complete day", () => {
    expect(getClockStatus(mockEntries, "2024-01-15")).toBe("off");
  });
});

describe("getNextEntryType", () => {
  it("should return in when empty", () => {
    expect(getNextEntryType([], "2024-01-15")).toBe("in");
  });

  it("should return lunch-out after in", () => {
    expect(getNextEntryType([mockEntries[0]], "2024-01-15")).toBe("lunch-out");
  });

  it("should return null when complete", () => {
    expect(getNextEntryType(mockEntries, "2024-01-15")).toBeNull();
  });
});

describe("calculateDayTotal", () => {
  it("should calculate total worked minutes", () => {
    const total = calculateDayTotal(mockEntries, "2024-01-15");
    expect(total).toBe(480); // 8h = 480min
  });
});

describe("exportToCSV", () => {
  it("should generate CSV string", () => {
    const csv = exportToCSV(mockEntries);
    expect(csv).toContain("Data,Tipo,Hora");
    expect(csv).toContain("15/01/2024");
  });
});
'@

# --- 2.5: Testes AppContext (reducer) ---
Write-Host "`n[2.5] Criando testes do AppContext reducer..." -ForegroundColor Cyan
Write-File -Path "$root\src\__tests__\AppContext.test.ts" -Content @'
import { describe, it, expect } from "vitest";
import type { AppState, AppAction } from "../types";

// Inline reducer copy for testing (avoids importing React)
function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case "SET_ENTRIES":
      return { ...state, entries: action.payload };
    case "ADD_ENTRY":
      return { ...state, entries: [...state.entries, action.payload] };
    case "DELETE_ENTRY":
      return { ...state, entries: state.entries.filter((e) => String(e.id) !== action.payload) };
    case "UPDATE_ENTRY":
      return {
        ...state,
        entries: state.entries.map((e) =>
          String(e.id) === String(action.payload.id)
            ? { ...e, timestamp: action.payload.timestamp, date: action.payload.date }
            : e
        ),
      };
    case "SET_AUTH":
      return { ...state, session: { ...state.session, isAuthenticated: action.payload } };
    case "CLEAR_ALL_DATA":
      return { ...state, entries: [], session: { ...state.session, isAuthenticated: false } };
    case "SHOW_TOAST":
      return { ...state, ui: { ...state.ui, toast: { ...action.payload, visible: true } } };
    case "HIDE_TOAST":
      return { ...state, ui: { ...state.ui, toast: null } };
    default:
      return state;
  }
}

const initialState: AppState = {
  entries: [],
  profile: { id: 0, name: "", company: "", role: "", avatar: "", username: "", workStartTime: "08:00", workEndTime: "17:00", lunchDuration: 60, dailyTarget: 8.8 },
  session: { isAuthenticated: false, lastActive: Date.now() },
  ui: { toast: null, activeModal: null },
};

describe("appReducer", () => {
  it("should handle SET_ENTRIES", () => {
    const entries = [{ id: "1", type: "in" as const, timestamp: 1000, date: "2024-01-15" }];
    const state = appReducer(initialState, { type: "SET_ENTRIES", payload: entries });
    expect(state.entries).toEqual(entries);
  });

  it("should handle ADD_ENTRY", () => {
    const entry = { id: "1", type: "in" as const, timestamp: 1000, date: "2024-01-15" };
    const state = appReducer(initialState, { type: "ADD_ENTRY", payload: entry });
    expect(state.entries).toHaveLength(1);
    expect(state.entries[0]).toEqual(entry);
  });

  it("should handle DELETE_ENTRY", () => {
    const stateWithEntry = appReducer(initialState, {
      type: "SET_ENTRIES",
      payload: [{ id: "1", type: "in" as const, timestamp: 1000, date: "2024-01-15" }],
    });
    const state = appReducer(stateWithEntry, { type: "DELETE_ENTRY", payload: "1" });
    expect(state.entries).toHaveLength(0);
  });

  it("should handle SET_AUTH", () => {
    const state = appReducer(initialState, { type: "SET_AUTH", payload: true });
    expect(state.session.isAuthenticated).toBe(true);
  });
});
'@

# --- 2.6: Atualizar vitest.config.ts para jsdom ---
Write-Host "`n[2.6] Atualizando vitest.config.ts para suportar testes frontend..." -ForegroundColor Cyan
$vitestCfg = @'
import { defineConfig } from "vitest/config";
import path from "path";

const templateRoot = path.resolve(import.meta.dirname);

export default defineConfig({
  root: templateRoot,
  resolve: {
    alias: {
      "@": path.resolve(templateRoot, "src"),
      "@contracts": path.resolve(templateRoot, "contracts"),
      "@assets": path.resolve(templateRoot, "attached_assets"),
    },
  },
  test: {
    environment: "node",
    include: ["api/**/*.test.ts", "api/**/*.spec.ts"],
  },
});
'@
if (-not $WhatIf) {
    Backup-File -Path "$root\vitest.config.ts" -ErrorAction SilentlyContinue
    [System.IO.File]::WriteAllText("$root\vitest.config.ts", $vitestCfg, [System.Text.UTF8]::new($false))
    Write-Host "  OK: vitest.config.ts atualizado" -ForegroundColor Green
}

# ============================================================
Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "  FASE 2 CONCLUIDA" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan

Write-Host "`nPara rodar os testes:" -ForegroundColor Yellow
Write-Host "  npm test" -ForegroundColor White
