/**
 * marktheme — a self-contained Markdown renderer with syntax highlighting,
 * TeX math and a token-based theme system.
 *
 * Zero dependencies. Runs in Node and in the browser. Nothing here touches
 * the DOM except the optional attachCopyButtons helper at the bottom, so it
 * is safe to call during a build.
 *
 *   import { createMarkdown } from './marktheme.js';
 *
 *   const md = createMarkdown({ theme: 'dark' });
 *   document.head.insertAdjacentHTML('beforeend', `<style>${md.css}</style>`);
 *   target.className = 'md';
 *   target.innerHTML = md.render(source).html;
 *
 * Contents, in order:
 *   1. Syntax highlighting   — ten languages from one table-driven scanner
 *   2. TeX math              — a subset renderer emitting themed HTML
 *   3. Markdown parser       — CommonMark subset plus ::: containers
 *   4. Themes                — design tokens to CSS custom properties
 *   5. HTML renderer         — AST to markup, every node overridable
 *   6. Public API            — createMarkdown, renderMarkdown, helpers
 *
 * See README.md for the full option list and the theming guide.
 */

/* ═══════════════════════════════════════════════════════════════════════
   1. SYNTAX HIGHLIGHTING
   ═══════════════════════════════════════════════════════════════════════ */

const words = (text) => new Set(text.trim().split(/\s+/));

/* ── Shared fragments ─────────────────────────────────────────────────── */

const C_STRINGS = [
  { open: '"', close: '"', escape: true },
  { open: "'", close: "'", escape: true },
];

const NUM = /^(?:0[xX][0-9a-fA-F_]+|0[bB][01_]+|0[oO][0-7_]+|(?:\d[\d_]*)?\.?\d[\d_]*(?:[eE][+-]?\d+)?)[uUlLfFdDmMn]*/;

/* ── Language table ───────────────────────────────────────────────────── */

const LANGS = {
  javascript: {
    aliases: ["js", "jsx", "mjs", "cjs", "node"],
    keywords: words(`
      as async await break case catch class const continue debugger default delete do else
      export extends finally for from function get if import in instanceof let new of return
      set static super switch this throw try typeof var void while with yield`),
    literals: words("true false null undefined NaN Infinity"),
    builtins: words(`
      Array Boolean Date Error JSON Map Math Number Object Promise Proxy Reflect RegExp Set
      String Symbol WeakMap WeakSet BigInt console document window globalThis fetch
      setTimeout setInterval structuredClone`),
    lineComment: ["//"],
    blockComment: [["/*", "*/"]],
    strings: [...C_STRINGS, { open: "`", close: "`", escape: true, interpolate: true }],
    regex: true,
  },

  typescript: {
    aliases: ["ts", "tsx"],
    inherit: "javascript",
    extraKeywords: words(`
      abstract any asserts bigint boolean declare enum implements infer interface is keyof
      namespace never number object private protected public readonly require satisfies string
      symbol type undefined unique unknown`),
    types: words("Array Partial Record Readonly Pick Omit Promise ReturnType Awaited"),
  },

  python: {
    aliases: ["py"],
    keywords: words(`
      and as assert async await break class continue def del elif else except finally for from
      global if import in is lambda match nonlocal not or pass raise return try while with yield`),
    literals: words("True False None NotImplemented Ellipsis"),
    builtins: words(`
      abs all any bool bytes callable dict dir enumerate filter float format frozenset getattr
      hasattr hash id input int isinstance issubclass iter len list map max min next object open
      ord print property range repr reversed round set setattr sorted str sum super tuple type zip
      self cls __init__ __name__ __main__`),
    lineComment: ["#"],
    strings: [{ open: '"""', close: '"""', escape: true, multiline: true }, { open: "'''", close: "'''", escape: true, multiline: true }, ...C_STRINGS],
    prefixedStrings: /^[rRbBfFuU]{1,2}(?=["'])/,
    decorator: /^@[\w.]+/,
  },

  java: {
    keywords: words(`
      abstract assert break case catch class const continue default do else enum extends final
      finally for goto if implements import instanceof interface native new package private
      protected public return static strictfp super switch synchronized this throw throws
      transient try var volatile while yield record sealed permits`),
    literals: words("true false null"),
    types: words(`
      boolean byte char double float int long short void String Object Integer Double Boolean
      Long List Map Set ArrayList HashMap Optional Stream`),
    annotation: /^@\w+/,
    lineComment: ["//"],
    blockComment: [["/*", "*/"]],
    strings: [{ open: '"""', close: '"""', escape: true, multiline: true }, ...C_STRINGS],
  },

  c: {
    keywords: words(`
      auto break case const continue default do else enum extern for goto if inline register
      restrict return sizeof static struct switch typedef union volatile while _Atomic
      _Bool _Static_assert`),
    literals: words("NULL true false"),
    types: words(`
      char double float int long short signed unsigned void size_t ssize_t int8_t int16_t
      int32_t int64_t uint8_t uint16_t uint32_t uint64_t bool FILE`),
    lineComment: ["//"],
    blockComment: [["/*", "*/"]],
    strings: C_STRINGS,
    preprocessor: true,
  },

  cpp: {
    aliases: ["c++", "cc", "hpp", "cxx"],
    inherit: "c",
    extraKeywords: words(`
      alignas alignof and catch class co_await co_return co_yield concept constexpr consteval
      constinit decltype delete dynamic_cast explicit export friend mutable namespace new
      noexcept nullptr operator private protected public reinterpret_cast requires static_assert
      static_cast template this throw try typeid typename using virtual`),
    types: words(`
      string vector map unordered_map set unordered_set array pair tuple optional variant
      shared_ptr unique_ptr weak_ptr ostream istream stringstream size_t std`),
  },

  csharp: {
    aliases: ["cs", "c#", "dotnet"],
    keywords: words(`
      abstract as async await base break case catch checked class const continue default
      delegate do else enum event explicit extern finally fixed for foreach get goto if
      implicit in init interface internal is lock namespace new operator out override params
      private protected public readonly record ref return sealed set sizeof stackalloc static
      struct switch this throw try typeof unchecked unsafe using var virtual void volatile
      when where while yield`),
    literals: words("true false null"),
    types: words(`
      bool byte char decimal double dynamic float int long object sbyte short string uint
      ulong ushort List Dictionary Task IEnumerable Nullable Span Console`),
    attribute: /^\[[A-Z]\w*(?:\([^)]*\))?\]/,
    lineComment: ["//"],
    blockComment: [["/*", "*/"]],
    strings: [{ open: '@"', close: '"', escape: false }, ...C_STRINGS],
    preprocessor: true,
  },

  bash: {
    aliases: ["sh", "shell", "zsh", "console"],
    keywords: words(`
      if then elif else fi for while until do done case esac function in select time break
      continue return exit local export readonly declare source alias unset trap shift`),
    builtins: words(`
      awk cat cd chmod chown cp curl cut date df du echo env find git grep head kill ln ls
      make mkdir mv node npm printf ps pwd python rm rsync sed sort ssh sudo tail tar tee
      touch tr uname uniq wc wget xargs yarn docker kubectl`),
    lineComment: ["#"],
    strings: [
      { open: '"', close: '"', escape: true, interpolate: true },
      { open: "'", close: "'", escape: false },
    ],
    variable: /^\$(?:\{[^}]*\}|[\w@*#?$!-]+)/,
    // A leading $ in a console transcript is a prompt, not code. `#` is
    // deliberately excluded: as a root prompt it is far rarer than as a
    // comment, and guessing wrong silently discards the comment.
    prompt: /^\s*\$\s/,
  },

  cmd: {
    aliases: ["bat", "batch", "powershell", "ps1", "dos"],
    caseInsensitive: true,
    keywords: words(`
      if else for in do goto call exit set setlocal endlocal shift rem echo pause exist not
      errorlevel defined equ neu lss leq gtr geq param function return foreach where select`),
    builtins: words(`
      cd dir copy move del ren mkdir md rmdir rd type find findstr cls start tasklist taskkill
      ping ipconfig net sc reg powershell cmd xcopy robocopy attrib chdir`),
    lineComment: ["::"],
    lineCommentWord: /^rem\b/i,
    strings: [{ open: '"', close: '"', escape: false }],
    variable: /^(?:%[\w~:.]+%|%%?[a-zA-Z]|\$[\w:]+)/,
    // `%` opens a variable here, so it must not be swallowed by an operator
    // run: without this, `set X=%PATH%` tokenizes as `=%` + `PATH` + `%`.
    operators: /^[+\-*/=<>!&|^~?:]+/,
    label: /^:[\w.-]+/,
  },

  sql: {
    aliases: ["postgres", "postgresql", "mysql", "sqlite", "plsql"],
    caseInsensitive: true,
    keywords: words(`
      add all alter analyze and any as asc begin between by cascade case cast check column
      commit constraint create cross cube current_date current_timestamp database default
      delete desc distinct drop else end except exists explain false fetch filter first
      foreign from full grant group having if ilike in index inner insert intersect into is
      join key left like limit not null nulls offset on or order outer over partition primary
      references rename replace returning revoke right rollback row rows select set some table
      then to transaction true truncate union unique update using values view when where
      window with`),
    types: words(`
      bigint bit blob boolean bytea char character date decimal double float int integer
      interval json jsonb numeric real serial smallint text time timestamp timestamptz uuid
      varchar xml`),
    builtins: words(`
      abs avg cast coalesce concat count date_trunc extract greatest json_agg lag lead least
      length lower max min now nullif rank row_number substring sum to_char trim upper`),
    lineComment: ["--"],
    blockComment: [["/*", "*/"]],
    strings: [
      { open: "'", close: "'", escape: false, doubled: true },
      { open: '"', close: '"', escape: false, doubled: true },
      { open: "`", close: "`", escape: false },
    ],
  },
};

/* Resolve inheritance and build the alias index once, at module load. */
const REGISTRY = new Map();

for (const [name, spec] of Object.entries(LANGS)) {
  const base = spec.inherit ? LANGS[spec.inherit] : {};
  const resolved = {
    ...base,
    ...spec,
    keywords: new Set([...(base.keywords ?? []), ...(spec.keywords ?? []), ...(spec.extraKeywords ?? [])]),
    literals: new Set([...(base.literals ?? []), ...(spec.literals ?? [])]),
    builtins: new Set([...(base.builtins ?? []), ...(spec.builtins ?? [])]),
    types: new Set([...(base.types ?? []), ...(spec.types ?? [])]),
  };
  REGISTRY.set(name, resolved);
  for (const alias of spec.aliases ?? []) REGISTRY.set(alias, resolved);
}

export const supportedLanguages = [...new Set(REGISTRY.keys())].sort();

/* ── Scanner ──────────────────────────────────────────────────────────── */

const OPERATORS_DEFAULT = /^[+\-*/%=<>!&|^~?:]+/;
const IDENT_START = /[A-Za-z_$\\]/;
const IDENT = /^[A-Za-z0-9_$]+/;

/**
 * True when a regex literal (or a shell/SQL construct that looks like one)
 * can legally start here. Without this, `a / b / c` becomes a string.
 */
function regexAllowed(tokens, pending) {
  // Plain identifiers sit in the scanner's buffer rather than the token list,
  // so `b / c / d` would otherwise look like a regex after the `=`.
  const tail = pending.trimEnd();
  if (tail) return !/[A-Za-z0-9_$)\]]$/.test(tail);

  for (let i = tokens.length - 1; i >= 0; i--) {
    const token = tokens[i];
    if (token.c === null && !token.t.trim()) continue;
    if (token.c === "key") return true;
    if (token.c === "op" || token.c === "punc") return !/[)\]]$/.test(token.t);
    return false;
  }
  return true;
}

function tokenize(code, spec) {
  const tokens = [];
  let i = 0;
  let plain = "";

  const push = (c, t) => {
    if (plain) {
      tokens.push({ c: null, t: plain });
      plain = "";
    }
    tokens.push({ c, t });
  };

  const atLineStart = () => {
    for (let j = tokens.length - 1; j >= 0; j--) {
      if (tokens[j].t.includes("\n")) return !plain.trim();
      if (tokens[j].t.trim()) return false;
    }
    return !plain.trim();
  };

  while (i < code.length) {
    const rest = code.slice(i);
    const ch = code[i];

    /* Console prompts. */
    if (spec.prompt && atLineStart()) {
      const prompt = spec.prompt.exec(rest);
      if (prompt) {
        push("punc", prompt[0]);
        i += prompt[0].length;
        continue;
      }
    }

    /* Comments. */
    let matched = false;
    for (const [open, close] of spec.blockComment ?? []) {
      if (rest.startsWith(open)) {
        const end = code.indexOf(close, i + open.length);
        const stop = end === -1 ? code.length : end + close.length;
        push("com", code.slice(i, stop));
        i = stop;
        matched = true;
        break;
      }
    }
    if (matched) continue;

    for (const open of spec.lineComment ?? []) {
      if (rest.startsWith(open)) {
        const end = code.indexOf("\n", i);
        const stop = end === -1 ? code.length : end;
        push("com", code.slice(i, stop));
        i = stop;
        matched = true;
        break;
      }
    }
    if (matched) continue;

    if (spec.lineCommentWord && atLineStart() && spec.lineCommentWord.test(rest)) {
      const end = code.indexOf("\n", i);
      const stop = end === -1 ? code.length : end;
      push("com", code.slice(i, stop));
      i = stop;
      continue;
    }

    /* Preprocessor and shell/batch specials. */
    if (spec.preprocessor && ch === "#" && atLineStart()) {
      const end = code.indexOf("\n", i);
      const stop = end === -1 ? code.length : end;
      push("key", code.slice(i, stop));
      i = stop;
      continue;
    }

    for (const key of ["decorator", "annotation", "attribute", "label"]) {
      if (!spec[key]) continue;
      const m = spec[key].exec(rest);
      if (m) {
        push(key === "label" ? "fn" : "builtin", m[0]);
        i += m[0].length;
        matched = true;
        break;
      }
    }
    if (matched) continue;

    if (spec.variable) {
      const m = spec.variable.exec(rest);
      if (m) {
        push("var", m[0]);
        i += m[0].length;
        continue;
      }
    }

    /* Strings. Prefixes (Python's f/r/b) are absorbed into the token. */
    let prefix = "";
    if (spec.prefixedStrings) {
      const m = spec.prefixedStrings.exec(rest);
      if (m) prefix = m[0];
    }

    const afterPrefix = rest.slice(prefix.length);
    const quote = (spec.strings ?? []).find((s) => afterPrefix.startsWith(s.open));
    if (quote) {
      let j = i + prefix.length + quote.open.length;
      while (j < code.length) {
        if (quote.escape && code[j] === "\\") {
          j += 2;
          continue;
        }
        if (code.startsWith(quote.close, j)) {
          // '' inside a SQL string is an escaped quote, not a terminator.
          if (quote.doubled && code.startsWith(quote.close, j + quote.close.length)) {
            j += quote.close.length * 2;
            continue;
          }
          j += quote.close.length;
          break;
        }
        if (!quote.multiline && code[j] === "\n") break;
        j++;
      }
      push("str", code.slice(i, j));
      i = j;
      continue;
    }

    /* Regex literals. */
    if (spec.regex && ch === "/" && regexAllowed(tokens, plain)) {
      let j = i + 1;
      let inClass = false;
      let closed = false;
      while (j < code.length) {
        if (code[j] === "\\") {
          j += 2;
          continue;
        }
        if (code[j] === "[") inClass = true;
        else if (code[j] === "]") inClass = false;
        else if (code[j] === "/" && !inClass) {
          closed = true;
          j++;
          break;
        } else if (code[j] === "\n") break;
        j++;
      }
      if (closed) {
        while (j < code.length && /[dgimsuvy]/.test(code[j])) j++;
        push("str", code.slice(i, j));
        i = j;
        continue;
      }
    }

    /* Numbers. */
    if (/\d/.test(ch) || (ch === "." && /\d/.test(code[i + 1] ?? ""))) {
      const m = NUM.exec(rest);
      if (m) {
        push("num", m[0]);
        i += m[0].length;
        continue;
      }
    }

    /* Identifiers and keywords. */
    if (IDENT_START.test(ch)) {
      const m = IDENT.exec(rest) ?? [ch];
      const word = m[0];
      const probe = spec.caseInsensitive ? word.toLowerCase() : word;
      const next = rest.slice(word.length).match(/^\s*(.?)/)?.[1] ?? "";

      let cls = null;
      if (spec.keywords.has(probe)) cls = "key";
      else if (spec.literals.has(probe)) cls = "num";
      else if (spec.types.has(probe) || spec.types.has(word)) cls = "type";
      else if (spec.builtins.has(probe) || spec.builtins.has(word)) cls = "builtin";
      else if (next === "(") cls = "fn";
      // PascalCase in a curly-brace language is almost always a type. The
      // lowercase second character matters: it keeps SCREAMING_CASE constants
      // out, which are values, not types.
      else if (spec.blockComment && /^[A-Z][a-z]/.test(word)) cls = "type";

      if (cls) push(cls, word);
      else plain += word;
      i += word.length;
      continue;
    }

    /* Operators and punctuation. */
    const operator = (spec.operators ?? OPERATORS_DEFAULT).exec(rest);
    if (operator) {
      push("op", operator[0]);
      i += operator[0].length;
      continue;
    }
    if ("()[]{},;.".includes(ch)) {
      push("punc", ch);
      i++;
      continue;
    }

    plain += ch;
    i++;
  }

  if (plain) tokens.push({ c: null, t: plain });
  return tokens;
}

/* ── Public API ───────────────────────────────────────────────────────── */

/**
 * Highlights a code string. An unknown or absent language falls back to plain
 * lines rather than throwing, so a typo in a fence info string degrades to
 * unstyled code instead of a failed build.
 */
export function highlight(code, lang) {
  const source = code.replace(/\r\n?/g, "\n").replace(/\n+$/, "");
  const spec = REGISTRY.get((lang || "").toLowerCase());

  if (!spec) return source.split("\n").map((line) => (line ? [{ c: null, t: line }] : []));

  const tokens = tokenize(source, spec);

  /* Split tokens across line boundaries so each output line is complete on
     its own — multi-line comments and template strings included. */
  const lines = [[]];
  for (const token of tokens) {
    const parts = token.t.split("\n");
    parts.forEach((part, index) => {
      if (index > 0) lines.push([]);
      if (part) lines[lines.length - 1].push({ c: token.c, t: part });
    });
  }
  return lines;
}

/* ═══════════════════════════════════════════════════════════════════════
   2. TEX MATH
   ═══════════════════════════════════════════════════════════════════════ */

const ESCAPES = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" };
const esc = (text) => String(text).replace(/[&<>"]/g, (c) => ESCAPES[c]);

/* ── Symbols ──────────────────────────────────────────────────────────── */

const GREEK = {
  alpha: "α",
  beta: "β",
  gamma: "γ",
  delta: "δ",
  epsilon: "ε",
  varepsilon: "ε",
  zeta: "ζ",
  eta: "η",
  theta: "θ",
  vartheta: "ϑ",
  iota: "ι",
  kappa: "κ",
  lambda: "λ",
  mu: "μ",
  nu: "ν",
  xi: "ξ",
  pi: "π",
  varpi: "ϖ",
  rho: "ρ",
  varrho: "ϱ",
  sigma: "σ",
  varsigma: "ς",
  tau: "τ",
  upsilon: "υ",
  phi: "φ",
  varphi: "ϕ",
  chi: "χ",
  psi: "ψ",
  omega: "ω",
  Gamma: "Γ",
  Delta: "Δ",
  Theta: "Θ",
  Lambda: "Λ",
  Xi: "Ξ",
  Pi: "Π",
  Sigma: "Σ",
  Upsilon: "Υ",
  Phi: "Φ",
  Psi: "Ψ",
  Omega: "Ω",
};

/** Symbols that renderTex as operators — spaced on both sides. */
const OPERATORS = {
  times: "×",
  div: "÷",
  pm: "±",
  mp: "∓",
  cdot: "⋅",
  ast: "∗",
  star: "⋆",
  circ: "∘",
  bullet: "∙",
  oplus: "⊕",
  ominus: "⊖",
  otimes: "⊗",
  odot: "⊙",
  leq: "≤",
  le: "≤",
  geq: "≥",
  ge: "≥",
  neq: "≠",
  ne: "≠",
  equiv: "≡",
  approx: "≈",
  sim: "∼",
  simeq: "≃",
  cong: "≅",
  propto: "∝",
  ll: "≪",
  gg: "≫",
  subset: "⊂",
  supset: "⊃",
  subseteq: "⊆",
  supseteq: "⊇",
  in: "∈",
  notin: "∉",
  ni: "∋",
  cup: "∪",
  cap: "∩",
  setminus: "∖",
  to: "→",
  rightarrow: "→",
  leftarrow: "←",
  leftrightarrow: "↔",
  Rightarrow: "⇒",
  Leftarrow: "⇐",
  Leftrightarrow: "⇔",
  mapsto: "↦",
  land: "∧",
  lor: "∨",
  lnot: "¬",
  forall: "∀",
  exists: "∃",
  nexists: "∄",
  wedge: "∧",
  vee: "∨",
  perp: "⊥",
  parallel: "∥",
  angle: "∠",
};

/** Symbols that renderTex as ordinary atoms — no extra spacing. */
const ATOMS = {
  infty: "∞",
  partial: "∂",
  nabla: "∇",
  emptyset: "∅",
  varnothing: "∅",
  ell: "ℓ",
  hbar: "ℏ",
  Re: "ℜ",
  Im: "ℑ",
  aleph: "ℵ",
  degree: "°",
  dots: "…",
  ldots: "…",
  cdots: "⋯",
  vdots: "⋮",
  ddots: "⋱",
  prime: "′",
  neg: "¬",
  surd: "√",
  top: "⊤",
  bot: "⊥",
  therefore: "∴",
  because: "∵",
  mathbbR: "ℝ",
  mathbbN: "ℕ",
  mathbbZ: "ℤ",
  mathbbQ: "ℚ",
  mathbbC: "ℂ",
};

/** Operators that take limits above and below in display mode. */
const BIG = {
  sum: "∑",
  prod: "∏",
  coprod: "∐",
  bigcup: "⋃",
  bigcap: "⋂",
  bigoplus: "⨁",
  bigotimes: "⨂",
  bigvee: "⋁",
  bigwedge: "⋀",
  int: "∫",
  iint: "∬",
  iiint: "∭",
  oint: "∮",
  lim: "lim",
  max: "max",
  min: "min",
  sup: "sup",
  inf: "inf",
  argmax: "arg max",
  argmin: "arg min",
};

/** Function names set upright rather than italic. */
const FUNCTIONS = new Set(["sin", "cos", "tan", "cot", "sec", "csc", "arcsin", "arccos", "arctan", "sinh", "cosh", "tanh", "log", "ln", "lg", "exp", "det", "dim", "ker", "deg", "gcd", "hom", "Pr", "mod", "bmod", "tr", "rank"]);

const DELIMS = {
  "(": "(",
  ")": ")",
  "[": "[",
  "]": "]",
  "\\{": "{",
  "\\}": "}",
  "|": "|",
  "\\|": "‖",
  "\\langle": "⟨",
  "\\rangle": "⟩",
  "\\lceil": "⌈",
  "\\rceil": "⌉",
  "\\lfloor": "⌊",
  "\\rfloor": "⌋",
  ".": "",
};

const SPACES = {
  quad: "1em",
  qquad: "2em",
  ",": "0.167em",
  ":": "0.222em",
  ";": "0.278em",
  "!": "-0.167em",
  " ": "0.25em",
};

/* ── Tokenizer ────────────────────────────────────────────────────────── */

function tokenizeTex(source) {
  const tokens = [];
  let i = 0;

  while (i < source.length) {
    const ch = source[i];

    if (ch === "\\") {
      // \\ is a row break; \, \; and friends are spacing commands.
      if (source[i + 1] === "\\") {
        tokens.push({ type: "newline" });
        i += 2;
        continue;
      }
      const name = /^\\([a-zA-Z]+|.)/.exec(source.slice(i));
      if (!name) {
        i++;
        continue;
      }
      tokens.push({ type: "command", name: name[1] });
      i += name[0].length;
      continue;
    }

    if (ch === "{") {
      tokens.push({ type: "open" });
      i++;
      continue;
    }
    if (ch === "}") {
      tokens.push({ type: "close" });
      i++;
      continue;
    }
    if (ch === "^" || ch === "_") {
      tokens.push({ type: "script", kind: ch });
      i++;
      continue;
    }
    if (ch === "&") {
      tokens.push({ type: "amp" });
      i++;
      continue;
    }
    if (/\s/.test(ch)) {
      i++;
      continue;
    }

    const number = /^\d+(\.\d+)?/.exec(source.slice(i));
    if (number) {
      tokens.push({ type: "number", value: number[0] });
      i += number[0].length;
      continue;
    }

    tokens.push({ type: "char", value: ch });
    i++;
  }

  return tokens;
}

/* ── Parser ───────────────────────────────────────────────────────────── */

/**
 * Reads one atom: a group, a command with its arguments, or a single
 * character. Scripts are attached by the caller so `x^2_i` and `x_i^2` behave
 * identically.
 */
function parseAtom(tokens, state) {
  const token = tokens[state.i];
  if (!token) return null;

  if (token.type === "open") {
    state.i++;
    const children = parseUntilClose(tokens, state);
    return { type: "group", children };
  }

  if (token.type === "command") return parseCommand(tokens, state);

  state.i++;

  if (token.type === "number") return { type: "num", value: token.value };
  if (token.type === "newline") return { type: "newline" };
  if (token.type === "amp") return { type: "amp" };

  const ch = token.value;
  if (DELIMS[ch] !== undefined && "()[]|".includes(ch)) {
    return { type: "delim", value: ch };
  }
  if ("+-=<>*/".includes(ch)) {
    return { type: "op", value: ch === "-" ? "−" : ch === "*" ? "∗" : ch };
  }
  if (/[a-zA-Z]/.test(ch)) return { type: "ident", value: ch };
  return { type: "atom", value: ch };
}

function parseUntilClose(tokens, state) {
  const nodes = [];
  while (state.i < tokens.length && tokens[state.i].type !== "close") {
    const node = parseNext(tokens, state);
    if (node) nodes.push(node);
  }
  state.i++;
  return nodes;
}

/** Parses one atom plus any sub/superscripts that follow it. */
function parseNext(tokens, state) {
  let base = parseAtom(tokens, state);
  if (!base) return null;

  while (tokens[state.i]?.type === "script") {
    const kind = tokens[state.i].kind;
    state.i++;
    const script = parseAtom(tokens, state);
    if (!script) break;
    base = kind === "^" ? { type: "scripted", base, sup: script, sub: base.sub ?? null } : { type: "scripted", base, sub: script, sup: base.sup ?? null };
    // Collapse a doubly-scripted node so both scripts hang off one base.
    if (base.base.type === "scripted") {
      base = {
        type: "scripted",
        base: base.base.base,
        sup: base.sup ?? base.base.sup,
        sub: base.sub ?? base.base.sub,
      };
    }
  }

  return base;
}

function parseGroupArg(tokens, state) {
  const node = parseAtom(tokens, state);
  if (!node) return { type: "group", children: [] };
  return node.type === "group" ? node : { type: "group", children: [node] };
}

/** Reads raw characters until the matching close brace — for \text. */
function readRawGroup(tokens, state) {
  if (tokens[state.i]?.type !== "open") {
    const node = parseAtom(tokens, state);
    return node?.value ?? "";
  }
  state.i++;
  let text = "";
  let depth = 1;
  while (state.i < tokens.length) {
    const token = tokens[state.i];
    if (token.type === "open") depth++;
    if (token.type === "close") {
      depth--;
      if (depth === 0) break;
    }
    if (token.type === "char" || token.type === "number") text += token.value;
    else if (token.type === "command") text += `\\${token.name}`;
    else text += " ";
    state.i++;
  }
  state.i++;
  return text;
}

const MATRIX_ENVS = {
  matrix: ["", ""],
  pmatrix: ["(", ")"],
  bmatrix: ["[", "]"],
  Bmatrix: ["{", "}"],
  vmatrix: ["|", "|"],
  Vmatrix: ["‖", "‖"],
};

function parseCommand(tokens, state) {
  const { name } = tokens[state.i];
  state.i++;

  if (name === "begin" || name === "end") {
    const env = readRawGroup(tokens, state);
    if (name === "end") return { type: "endenv", env };
    return parseEnvironment(tokens, state, env);
  }

  if (name === "frac" || name === "dfrac" || name === "tfrac") {
    return {
      type: "frac",
      numerator: parseGroupArg(tokens, state),
      denominator: parseGroupArg(tokens, state),
    };
  }

  if (name === "sqrt") {
    let index = null;
    // Optional [n] index: the tokenizer has already split it into chars.
    if (tokens[state.i]?.type === "char" && tokens[state.i].value === "[") {
      state.i++;
      const inner = [];
      while (state.i < tokens.length) {
        const token = tokens[state.i];
        if (token.type === "char" && token.value === "]") {
          state.i++;
          break;
        }
        const node = parseNext(tokens, state);
        if (node) inner.push(node);
        else state.i++;
      }
      index = { type: "group", children: inner };
    }
    return { type: "sqrt", index, radicand: parseGroupArg(tokens, state) };
  }

  if (name === "left" || name === "right") {
    const next = tokens[state.i];
    let delim = ".";
    if (next?.type === "char") {
      delim = next.value;
      state.i++;
    } else if (next?.type === "command") {
      delim = `\\${next.name}`;
      state.i++;
    }
    return { type: name === "left" ? "left" : "right", delim };
  }

  if (name === "text" || name === "textrm" || name === "mbox") {
    return { type: "text", value: readRawGroup(tokens, state) };
  }

  if (name === "mathbf" || name === "bm" || name === "boldsymbol") {
    return { type: "style", weight: "bold", child: parseGroupArg(tokens, state) };
  }
  if (name === "mathrm" || name === "operatorname") {
    return { type: "style", upright: true, child: parseGroupArg(tokens, state) };
  }
  if (name === "mathbb") {
    const inner = readRawGroup(tokens, state);
    return { type: "atom", value: ATOMS[`mathbb${inner}`] ?? inner };
  }
  if (name === "overline" || name === "underline" || name === "widebar") {
    return {
      type: "overline",
      under: name === "underline",
      child: parseGroupArg(tokens, state),
    };
  }
  if (name === "hat" || name === "bar" || name === "vec" || name === "tilde" || name === "dot") {
    const marks = { hat: "\u0302", bar: "\u0304", vec: "\u20d7", tilde: "\u0303", dot: "\u0307" };
    return { type: "accent", mark: marks[name], child: parseGroupArg(tokens, state) };
  }

  if (SPACES[name] !== undefined) return { type: "space", width: SPACES[name] };
  if (GREEK[name]) return { type: "ident", value: GREEK[name], greek: true };
  if (OPERATORS[name]) return { type: "op", value: OPERATORS[name] };
  if (ATOMS[name]) return { type: "atom", value: ATOMS[name] };
  if (BIG[name]) return { type: "big", value: BIG[name], word: BIG[name].length > 1 };
  if (FUNCTIONS.has(name)) return { type: "func", value: name };
  if (DELIMS[`\\${name}`] !== undefined) return { type: "delim", value: `\\${name}` };

  // Unknown macro: surface it rather than dropping it silently.
  return { type: "unknown", value: `\\${name}` };
}

function parseEnvironment(tokens, state, env) {
  const rows = [[[]]];
  const pushCell = () => rows[rows.length - 1].push([]);
  const pushRow = () => rows.push([[]]);

  while (state.i < tokens.length) {
    const token = tokens[state.i];
    if (token.type === "command" && token.name === "end") {
      state.i++;
      readRawGroup(tokens, state);
      break;
    }
    if (token.type === "amp") {
      state.i++;
      pushCell();
      continue;
    }
    if (token.type === "newline") {
      state.i++;
      pushRow();
      continue;
    }
    const node = parseNext(tokens, state);
    if (node) {
      const row = rows[rows.length - 1];
      row[row.length - 1].push(node);
    } else state.i++;
  }

  // Trailing \\ produces an empty final row; drop it.
  while (rows.length > 1 && rows[rows.length - 1].every((cell) => !cell.length)) rows.pop();

  return { type: "env", env, rows };
}

/* ── Renderer ─────────────────────────────────────────────────────────── */

/** Rough height of a subtree, in units of one text line. */
function texHeight(node) {
  if (!node || typeof node !== "object") return 1;
  switch (node.type) {
    case "frac":
      return texHeight(node.numerator) + texHeight(node.denominator);
    case "sqrt":
      return texHeight(node.radicand) + 0.15;
    case "scripted": {
      const base = texHeight(node.base);
      if (node.base?.type === "big") {
        return base + (node.sup ? 0.7 : 0) + (node.sub ? 0.7 : 0);
      }
      return base + (node.sup && node.sub ? 0.5 : 0.25);
    }
    case "big":
      return 1.4;
    case "group":
      return Math.max(1, ...node.children.map(texHeight));
    case "env":
      return Math.max(1, node.rows.length * 1.35);
    case "style":
    case "accent":
      return texHeight(node.child);
    default:
      return 1;
  }
}

function renderTex(nodes, ctx) {
  let html = "";
  // \left…\right pairs are flattened into a stretch wrapper.
  for (let i = 0; i < nodes.length; i++) {
    const node = nodes[i];
    if (node.type === "delim" && (node.value === "(" || node.value === "[")) {
      const shut = node.value === "(" ? ")" : "]";
      let depth = 1;
      let j = i + 1;
      for (; j < nodes.length; j++) {
        if (nodes[j].type === "delim" && nodes[j].value === node.value) depth++;
        else if (nodes[j].type === "delim" && nodes[j].value === shut) {
          depth--;
          if (depth === 0) break;
        }
      }
      if (j < nodes.length) {
        const inner = nodes.slice(i + 1, j);
        const stretch = Math.max(1, ...inner.map(texHeight));
        if (stretch > 1.3) {
          const s = ` style="--stretch:${stretch.toFixed(2)}"`;
          html += `<span class="mrow-paren"><span class="stretchy mo-tight"${s}>${esc(node.value)}</span>${renderTex(inner, ctx)}<span class="stretchy mo-tight"${s}>${esc(shut)}</span></span>`;
          i = j;
          continue;
        }
      }
    }
    if (node.type === "left") {
      const inner = [];
      let depth = 1;
      let close = ".";
      i++;
      for (; i < nodes.length; i++) {
        if (nodes[i].type === "left") depth++;
        if (nodes[i].type === "right") {
          depth--;
          if (depth === 0) {
            close = nodes[i].delim;
            break;
          }
        }
        inner.push(nodes[i]);
      }
      const open = DELIMS[node.delim] ?? node.delim;
      const shut = DELIMS[close] ?? close;
      const stretch = Math.max(1, ...inner.map(texHeight));
      const s = stretch > 1.05 ? ` style="--stretch:${stretch.toFixed(2)}"` : "";
      html += `<span class="mrow-paren"><span class="stretchy mo-tight"${s}>${esc(open)}</span>${renderTex(inner, ctx)}<span class="stretchy mo-tight"${s}>${esc(shut)}</span></span>`;
      continue;
    }
    html += renderTexNode(node, ctx);
  }
  return html;
}

function renderTexNode(node, ctx) {
  switch (node.type) {
    case "group":
      return renderTex(node.children, ctx);

    case "ident":
      return `<span class="mi">${esc(node.value)}</span>`;

    case "num":
      return esc(node.value);

    case "op":
      return `<span class="mo">${esc(node.value)}</span>`;

    case "atom":
    case "unknown":
      return esc(node.value);

    case "delim":
      return `<span class="mo-tight">${esc(DELIMS[node.value] ?? node.value)}</span>`;

    case "text":
      return `<span style="font-style:normal">${esc(node.value)}</span>`;

    case "func":
      return `<span class="mo-tight" style="font-style:normal">${esc(node.value)}</span>`;

    case "space":
      return `<span style="display:inline-block;width:${node.width}"></span>`;

    case "style": {
      const style = node.weight === "bold" ? "font-weight:600" : "font-style:normal";
      return `<span style="${style}">${renderTexNode(node.child, ctx)}</span>`;
    }

    case "accent":
      return `<span>${renderTexNode(node.child, ctx)}${node.mark}</span>`;

    case "overline":
      return `<span class="${node.under ? "munder" : "mover"}">${renderTexNode(node.child, ctx)}</span>`;

    case "frac":
      return `<span class="mfrac"><span>${renderTexNode(node.numerator, ctx)}</span><span>${renderTexNode(node.denominator, ctx)}</span></span>`;

    case "sqrt": {
      const index = node.index ? `<span class="mroot">${renderTexNode(node.index, ctx)}</span>` : "";
      return (
        `<span class="msqrt">${index}` +
        `<svg class="radical" viewBox="0 0 24 100" preserveAspectRatio="none" aria-hidden="true">` +
        `<path d="M0 58 L6 58 L12 95 L23 1 L24 1" fill="none" stroke="currentColor" ` +
        `stroke-width="1" vector-effect="non-scaling-stroke"/></svg>` +
        `<span class="radicand">${renderTexNode(node.radicand, ctx)}</span></span>`
      );
    }

    case "big": {
      const size = node.word ? null : ctx.display ? "1.8em" : "1.25em";
      const glyph = node.word ? `<span style="font-style:normal">${esc(node.value)}</span>` : `<span style="font-size:${size};line-height:1">${esc(node.value)}</span>`;
      return `<span class="mo">${glyph}</span>`;
    }

    case "scripted":
      return renderScripted(node, ctx);

    case "env":
      return renderEnv(node, ctx);

    case "newline":
    case "amp":
    case "endenv":
    case "right":
      return "";

    default:
      return esc(node.value ?? "");
  }
}

/**
 * Sub/superscripts. In display mode a big operator gets stacked limits, which
 * is the one place this renderer needs geometry the shared CSS does not
 * describe — hence the inline flex here rather than another class.
 */
function renderScripted(node, ctx) {
  const base = renderTexNode(node.base, ctx);
  const sup = node.sup ? renderTexNode(node.sup, ctx) : null;
  const sub = node.sub ? renderTexNode(node.sub, ctx) : null;

  if (ctx.display && node.base.type === "big") {
    const above = sup ? `<span style="font-size:0.62em;line-height:1.15;margin-bottom:0.1em">${sup}</span>` : "";
    const below = sub ? `<span style="font-size:0.62em;line-height:1.15;margin-top:0.1em">${sub}</span>` : "";
    return `<span style="display:inline-flex;flex-direction:column;align-items:center;vertical-align:middle;padding-inline:0.24em">${above}${base}${below}</span>`;
  }

  if (sup && sub) {
    return `${base}<span style="display:inline-flex;flex-direction:column;font-size:0.74em;line-height:1.05;vertical-align:-0.1em"><span>${sup}</span><span>${sub}</span></span>`;
  }
  if (sup) return `${base}<span class="msup">${sup}</span>`;
  return `${base}<span class="msub">${sub}</span>`;
}

function renderEnv(node, ctx) {
  const { env, rows } = node;

  if (env === "aligned" || env === "align" || env === "align*" || env === "gather") {
    const body = rows
      .map((cells) => `<span style="display:contents">${cells.map((cell, index) => `<span style="text-align:${index === 0 ? "right" : "left"};padding-right:${index === 0 ? "0.25em" : "0"}">${renderTex(cell, ctx)}</span>`).join("")}</span>`)
      .join("");
    const columns = Math.max(...rows.map((r) => r.length), 1);
    return `<span style="display:inline-grid;grid-template-columns:repeat(${columns},auto);row-gap:0.45em;align-items:baseline">${body}</span>`;
  }

  if (env === "cases") {
    const body = rows.map((cells) => cells.map((cell, index) => `<span style="text-align:left;padding-right:${index === 0 ? "1em" : "0"}">${renderTex(cell, ctx)}</span>`).join("")).join("");
    const columns = Math.max(...rows.map((r) => r.length), 1);
    return `<span class="mrow-paren"><span class="stretchy mo-tight" style="--stretch:${rows.length * 1.4}">{</span><span style="display:inline-grid;grid-template-columns:repeat(${columns},auto);row-gap:0.3em">${body}</span></span>`;
  }

  const brackets = MATRIX_ENVS[env];
  if (brackets) {
    const columns = Math.max(...rows.map((r) => r.length), 1);
    const body = rows.map((cells) => cells.map((cell) => `<span style="padding:0.1em 0.4em">${renderTex(cell, ctx)}</span>`).join("")).join("");
    const stretch = rows.length * 1.3;
    const open = brackets[0] ? `<span class="stretchy mo-tight" style="--stretch:${stretch}">${esc(brackets[0])}</span>` : "";
    const close = brackets[1] ? `<span class="stretchy mo-tight" style="--stretch:${stretch}">${esc(brackets[1])}</span>` : "";
    return `<span class="mrow-paren">${open}<span style="display:inline-grid;grid-template-columns:repeat(${columns},auto);align-items:center">${body}</span>${close}</span>`;
  }

  // Unknown environment: renderTex its contents rather than dropping them.
  return rows.map((cells) => cells.map((cell) => renderTex(cell, ctx)).join(" ")).join(" ");
}

/* ── Public API ───────────────────────────────────────────────────────── */

/**
 * Renders a TeX string to HTML.
 *
 * `display` switches on centred layout and stacked operator limits. Failures
 * return the escaped source marked with .math-error — a visible defect beats
 * a silent one, and it never breaks the build.
 */
export function renderMath(source, { display = false } = {}) {
  const tex = String(source).trim();
  if (!tex) return "";

  try {
    const tokens = tokenizeTex(tex);
    const state = { i: 0 };
    const nodes = [];
    while (state.i < tokens.length) {
      const node = parseNext(tokens, state);
      if (node) nodes.push(node);
      else state.i++;
    }

    const ctx = { display };
    const inner = renderTex(nodes, ctx);
    const cls = display ? "math math-display" : "math math-inline";
    return `<span class="${cls}" role="math">${inner}</span>`;
  } catch {
    return `<span class="math-error" role="math">${esc(tex)}</span>`;
  }
}

/* ═══════════════════════════════════════════════════════════════════════
   3. MARKDOWN PARSER
   ═══════════════════════════════════════════════════════════════════════ */

/* ── Frontmatter ──────────────────────────────────────────────────────── */

const NUMBER = /^-?\d+(\.\d+)?$/;

/** Unwraps quotes and coerces the handful of scalar types we use. */
function scalar(raw) {
  const value = raw.trim();
  if (!value) return "";
  if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
    return value.slice(1, -1);
  }
  if (value === "true") return true;
  if (value === "false") return false;
  if (value === "null" || value === "~") return null;
  if (NUMBER.test(value)) return Number(value);
  // Inline flow sequence: [a, b, c]
  if (value.startsWith("[") && value.endsWith("]")) {
    const inner = value.slice(1, -1).trim();
    return inner ? inner.split(",").map((item) => scalar(item)) : [];
  }
  // Inline flow mapping: { a: 1, b: 2 }
  if (value.startsWith("{") && value.endsWith("}")) {
    const inner = value.slice(1, -1).trim();
    if (!inner) return {};
    const out = {};
    for (const pair of splitTop(inner)) {
      const at = pair.indexOf(":");
      if (at === -1) continue;
      out[pair.slice(0, at).trim()] = scalar(pair.slice(at + 1));
    }
    return out;
  }
  return value;
}

/** Splits on commas that are not inside brackets or quotes. */
function splitTop(text) {
  const parts = [];
  let depth = 0;
  let quote = null;
  let start = 0;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (quote) {
      if (ch === quote) quote = null;
    } else if (ch === '"' || ch === "'") quote = ch;
    else if (ch === "[" || ch === "{") depth++;
    else if (ch === "]" || ch === "}") depth--;
    else if (ch === "," && depth === 0) {
      parts.push(text.slice(start, i));
      start = i + 1;
    }
  }
  parts.push(text.slice(start));
  return parts.map((p) => p.trim()).filter(Boolean);
}

/**
 * Parses the leading --- block. Supports scalars, inline flow collections,
 * block sequences (`- item`) and one level of nested mapping — which covers
 * every frontmatter shape in lib/config.js's documented format.
 */
export function parseFrontmatter(source) {
  const match = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?/.exec(source);
  if (!match) return { data: {}, body: source };

  const data = {};
  const lines = match[1].split(/\r?\n/);
  let key = null;
  let list = null;
  let nested = null;

  const flush = () => {
    if (key && list) data[key] = list;
    if (key && nested) data[key] = nested;
    list = null;
    nested = null;
  };

  for (const line of lines) {
    if (!line.trim() || line.trim().startsWith("#")) continue;
    const indented = /^\s+/.test(line);
    const trimmed = line.trim();

    if (indented && trimmed.startsWith("- ") && key) {
      (list ??= []).push(scalar(trimmed.slice(2)));
      continue;
    }
    if (indented && key && trimmed.includes(":")) {
      const at = trimmed.indexOf(":");
      (nested ??= {})[trimmed.slice(0, at).trim()] = scalar(trimmed.slice(at + 1));
      continue;
    }

    flush();
    const at = trimmed.indexOf(":");
    if (at === -1) continue;
    key = trimmed.slice(0, at).trim();
    const rest = trimmed.slice(at + 1).trim();
    if (rest === "") data[key] = "";
    else data[key] = scalar(rest);
  }
  flush();

  return { data, body: source.slice(match[0].length) };
}

/* ── Helpers ──────────────────────────────────────────────────────────── */

export function slugify(text) {
  return (
    String(text)
      .toLowerCase()
      .normalize("NFKD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 72) || "section"
  );
}

/** `src=video-1.webm poster=a.webp caption="two words"` → object. */
function parseAttrs(text) {
  const attrs = {};
  const re = /([\w-]+)\s*=\s*("[^"]*"|'[^']*'|[^\s]+)|([\w-]+)/g;
  let m;
  while ((m = re.exec(text))) {
    if (m[3]) attrs[m[3]] = true;
    else attrs[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
  return attrs;
}

/**
 * Directives whose bodies are raw lines rather than markdown. A gallery body
 * is a list of filenames; parsing it as markdown would turn it into a
 * paragraph and lose the line structure.
 */
const RAW_DIRECTIVES = new Set(["gallery", "video", "audio", "model"]);

/* ── Block parsing ────────────────────────────────────────────────────── */

const RE = {
  heading: /^(#{1,6})\s+(.*)$/,
  fence: /^(\s*)(`{3,}|~{3,})\s*(.*)$/,
  directive: /^:::\s*([\w-]+)\s*(.*)$/,
  directiveEnd: /^:::\s*$/,
  hr: /^\s{0,3}(?:(?:\*\s*){3,}|(?:-\s*){3,}|(?:_\s*){3,})$/,
  bullet: /^(\s*)([-*+])\s+(.*)$/,
  ordered: /^(\s*)(\d{1,9})[.)]\s+(.*)$/,
  quote: /^\s{0,3}>\s?(.*)$/,
  tableRule: /^\s*\|?\s*:?-{2,}:?\s*(\|\s*:?-{2,}:?\s*)*\|?\s*$/,
  footnote: /^\[\^([^\]]+)\]:\s*(.*)$/,
  task: /^\[([ xX])\]\s+(.*)$/,
};

function parseBlocks(lines, ctx) {
  const nodes = [];
  let i = 0;

  const paragraphBuffer = [];
  const flushParagraph = () => {
    if (!paragraphBuffer.length) return;
    const text = paragraphBuffer.join("\n").trim();
    paragraphBuffer.length = 0;
    if (text) nodes.push({ type: "paragraph", children: parseInline(text, ctx) });
  };

  while (i < lines.length) {
    const line = lines[i];

    if (!line.trim()) {
      flushParagraph();
      i++;
      continue;
    }

    /* Fenced code. The info string carries language plus optional
       `title=… {1,4-6}` metadata for filename and highlighted lines. */
    const fence = RE.fence.exec(line);
    if (fence) {
      flushParagraph();
      const marker = fence[2][0];
      const width = fence[2].length;
      const info = fence[3].trim();
      const body = [];
      i++;
      while (i < lines.length) {
        const close = RE.fence.exec(lines[i]);
        if (close && close[2][0] === marker && close[2].length >= width && !close[3].trim()) {
          i++;
          break;
        }
        body.push(lines[i]);
        i++;
      }
      nodes.push(codeNode(body.join("\n"), info));
      continue;
    }

    /* Display math. */
    if (line.trim() === "$$") {
      flushParagraph();
      const body = [];
      i++;
      while (i < lines.length && lines[i].trim() !== "$$") {
        body.push(lines[i]);
        i++;
      }
      i++;
      nodes.push({
        type: "math",
        display: true,
        html: renderMath(body.join("\n"), { display: true }),
      });
      continue;
    }

    /* Container directives. */
    const directive = RE.directive.exec(line);
    if (directive) {
      flushParagraph();
      const name = directive[1].toLowerCase();
      const attrs = parseAttrs(directive[2]);
      const body = [];
      let depth = 1;
      i++;
      while (i < lines.length) {
        if (RE.directive.test(lines[i])) depth++;
        else if (RE.directiveEnd.test(lines[i])) {
          depth--;
          if (depth === 0) {
            i++;
            break;
          }
        }
        body.push(lines[i]);
        i++;
      }
      nodes.push({
        type: "directive",
        name,
        attrs,
        // Raw directives keep their lines; the rest recurse so a note can
        // contain lists, code, anything.
        value: RAW_DIRECTIVES.has(name) ? body.map((l) => l.trim()).filter(Boolean) : null,
        children: RAW_DIRECTIVES.has(name) ? [] : parseBlocks(body, ctx),
      });
      continue;
    }

    /* Footnote definition. Collected, not emitted inline. */
    const footnote = RE.footnote.exec(line);
    if (footnote) {
      flushParagraph();
      const body = [footnote[2]];
      i++;
      while (i < lines.length && /^\s{2,}\S/.test(lines[i])) {
        body.push(lines[i].trim());
        i++;
      }
      ctx.footnotes.push({
        id: footnote[1],
        children: parseInline(body.join(" ").trim(), ctx),
      });
      continue;
    }

    const heading = RE.heading.exec(line);
    if (heading) {
      flushParagraph();
      const depth = heading[1].length;
      const children = parseInline(heading[2].trim(), ctx);
      const text = plainText(children);
      const id = uniqueId(slugify(text), ctx);
      nodes.push({ type: "heading", depth, id, children });
      ctx.headings.push({ id, text, depth });
      i++;
      continue;
    }

    if (RE.hr.test(line)) {
      flushParagraph();
      nodes.push({ type: "thematicBreak" });
      i++;
      continue;
    }

    /* Table: a pipe row followed by an alignment rule. */
    if (line.includes("|") && i + 1 < lines.length && RE.tableRule.test(lines[i + 1])) {
      flushParagraph();
      const header = splitRow(lines[i]);
      const align = splitRow(lines[i + 1]).map((cell) => {
        const left = cell.startsWith(":");
        const right = cell.endsWith(":");
        if (left && right) return "center";
        if (right) return "right";
        if (left) return "left";
        return null;
      });
      i += 2;
      const rows = [];
      while (i < lines.length && lines[i].includes("|") && lines[i].trim()) {
        rows.push(splitRow(lines[i]).map((cell) => parseInline(cell, ctx)));
        i++;
      }
      nodes.push({
        type: "table",
        align,
        header: header.map((cell) => parseInline(cell, ctx)),
        rows,
      });
      continue;
    }

    if (RE.quote.test(line)) {
      flushParagraph();
      const body = [];
      while (i < lines.length && (RE.quote.test(lines[i]) || (lines[i].trim() && body.length))) {
        const m = RE.quote.exec(lines[i]);
        body.push(m ? m[1] : lines[i]);
        i++;
      }
      nodes.push({ type: "blockquote", children: parseBlocks(body, ctx) });
      continue;
    }

    if (RE.bullet.test(line) || RE.ordered.test(line)) {
      flushParagraph();
      const { node, next } = parseList(lines, i, ctx);
      nodes.push(node);
      i = next;
      continue;
    }

    paragraphBuffer.push(line);
    i++;
  }

  flushParagraph();
  return nodes;
}

function splitRow(line) {
  return line
    .trim()
    .replace(/^\||\|$/g, "")
    .split(/(?<!\\)\|/)
    .map((cell) => cell.trim().replace(/\\\|/g, "|"));
}

/**
 * Lists. Continuation lines are gathered by indentation, then each item's
 * body recurses through parseBlocks — which is what makes nested lists and
 * code blocks inside list items work without special cases.
 */
function parseList(lines, start, ctx) {
  const first = RE.ordered.exec(lines[start]);
  const ordered = Boolean(first);
  const baseIndent = (first ?? RE.bullet.exec(lines[start]))[1].length;
  const items = [];
  let i = start;
  let loose = false;
  let current = null;

  while (i < lines.length) {
    const line = lines[i];
    const match = ordered ? RE.ordered.exec(line) : RE.bullet.exec(line);

    if (match && match[1].length === baseIndent) {
      if (current) items.push(current);
      current = [match[3]];
      i++;
      continue;
    }
    if (!line.trim()) {
      // A blank line inside the list makes it loose; two ends it.
      if (i + 1 < lines.length && lines[i + 1].trim() && /^\s{2,}/.test(lines[i + 1])) {
        loose = true;
        current?.push("");
        i++;
        continue;
      }
      break;
    }
    if (current && /^\s{2,}/.test(line)) {
      current.push(line.slice(baseIndent + 2));
      i++;
      continue;
    }
    if (current && !match) {
      // Lazy continuation of the item's paragraph.
      current.push(line.trim());
      i++;
      continue;
    }
    break;
  }
  if (current) items.push(current);

  const children = items.map((body) => {
    const head = body[0] ?? "";
    const task = RE.task.exec(head);
    if (task) body = [task[2], ...body.slice(1)];
    return {
      type: "listItem",
      checked: task ? task[1].toLowerCase() === "x" : null,
      children: parseBlocks(body, ctx),
    };
  });

  return {
    node: {
      type: "list",
      ordered,
      start: ordered ? Number(first[2]) : null,
      tight: !loose,
      children,
    },
    next: i,
  };
}

/** Builds a code node, running the highlighter and reading `{1,4-6}` meta. */
function codeNode(code, info) {
  const [langRaw, ...rest] = info.split(/\s+/);
  const meta = rest.join(" ");
  const lang = (langRaw || "").toLowerCase();

  const ranges = /\{([\d,\s-]+)\}/.exec(meta);
  const highlighted = new Set();
  if (ranges) {
    for (const part of ranges[1].split(",")) {
      const [a, b] = part.trim().split("-").map(Number);
      if (!a) continue;
      for (let n = a; n <= (b || a); n++) highlighted.add(n);
    }
  }

  const attrs = parseAttrs(meta.replace(/\{[\d,\s-]+\}/, ""));

  return {
    type: "code",
    lang,
    filename: attrs.title || attrs.file || null,
    // `numbers` defaults on for anything over four lines; short snippets read
    // better without a gutter.
    numbers: attrs.numbers === "false" ? false : code.split("\n").length > 4,
    highlight: [...highlighted],
    lines: highlight(code, lang),
  };
}

/* ── Inline parsing ───────────────────────────────────────────────────── */

const PUNCT = /[\\`*_{}[\]()#+\-.!$~|<>]/;

function parseInline(text, ctx) {
  const out = [];
  let buffer = "";
  let i = 0;

  const flush = () => {
    if (buffer) out.push({ type: "text", value: buffer });
    buffer = "";
  };

  while (i < text.length) {
    const ch = text[i];

    if (ch === "\\" && i + 1 < text.length && PUNCT.test(text[i + 1])) {
      buffer += text[i + 1];
      i += 2;
      continue;
    }

    if (ch === "`") {
      const run = /^`+/.exec(text.slice(i))[0];
      const close = text.indexOf(run, i + run.length);
      if (close !== -1) {
        flush();
        out.push({ type: "inlineCode", value: text.slice(i + run.length, close).trim() });
        i = close + run.length;
        continue;
      }
    }

    /* Inline math. `$5 and $6` must not become math, so a closing $ directly
       after whitespace or at a digit boundary is rejected. */
    if (ch === "$" && text[i + 1] !== "$") {
      const close = findMathClose(text, i + 1);
      if (close !== -1) {
        flush();
        out.push({
          type: "math",
          display: false,
          html: renderMath(text.slice(i + 1, close), { display: false }),
        });
        i = close + 1;
        continue;
      }
    }

    if (ch === "<") {
      const auto = /^<((?:https?|mailto):[^>\s]+)>/.exec(text.slice(i));
      if (auto) {
        flush();
        const href = auto[1];
        out.push({
          type: "link",
          url: href,
          children: [{ type: "text", value: href.replace(/^mailto:/, "") }],
        });
        i += auto[0].length;
        continue;
      }
    }

    if (ch === "!" && text[i + 1] === "[") {
      const parsed = parseBracket(text, i + 1);
      if (parsed && parsed.url !== null) {
        flush();
        out.push({
          type: "image",
          url: parsed.url,
          title: parsed.title,
          alt: parsed.label,
        });
        i = parsed.end;
        continue;
      }
    }

    if (ch === "[") {
      const footnote = /^\[\^([^\]]+)\]/.exec(text.slice(i));
      if (footnote) {
        flush();
        ctx.refs.add(footnote[1]);
        out.push({ type: "footnoteRef", id: footnote[1] });
        i += footnote[0].length;
        continue;
      }
      const parsed = parseBracket(text, i);
      if (parsed && parsed.url !== null) {
        flush();
        out.push({
          type: "link",
          url: parsed.url,
          title: parsed.title,
          children: parseInline(parsed.label, ctx),
        });
        i = parsed.end;
        continue;
      }
    }

    if (ch === "*" || ch === "_" || ch === "~") {
      const run = new RegExp(`^\\${ch}+`).exec(text.slice(i))[0];
      const width = ch === "~" ? 2 : Math.min(run.length, 2);
      const marker = ch.repeat(width);
      if (run.length >= width) {
        const from = i + width;
        const close = findClose(text, from, marker);
        if (close !== -1 && close > from) {
          flush();
          const children = parseInline(text.slice(from, close), ctx);
          const type = ch === "~" ? "delete" : width === 2 ? "strong" : "emphasis";
          out.push({ type, children });
          i = close + width;
          continue;
        }
      }
    }

    if (ch === "\n") {
      // Two trailing spaces or a backslash before the newline is a hard break.
      if (/ {2}$/.test(buffer) || buffer.endsWith("\\")) {
        buffer = buffer.replace(/(\s{2}|\\)$/, "");
        flush();
        out.push({ type: "break" });
      } else {
        buffer += " ";
      }
      i++;
      continue;
    }

    buffer += ch;
    i++;
  }

  flush();
  return out;
}

/** Finds the closing `$`, rejecting currency-like matches. */
function findMathClose(text, from) {
  for (let i = from; i < text.length; i++) {
    if (text[i] === "\\") {
      i++;
      continue;
    }
    if (text[i] !== "$") continue;
    const before = text[i - 1];
    if (before === undefined || /\s/.test(before)) continue;
    if (/\d/.test(text[i + 1] ?? "")) continue;
    return i;
  }
  return -1;
}

/** Finds a closing delimiter run, skipping escapes and code spans. */
function findClose(text, from, marker) {
  for (let i = from; i <= text.length - marker.length; i++) {
    if (text[i] === "\\") {
      i++;
      continue;
    }
    if (text[i] === "`") {
      const run = /^`+/.exec(text.slice(i))[0];
      const close = text.indexOf(run, i + run.length);
      if (close !== -1) {
        i = close + run.length - 1;
        continue;
      }
    }
    if (text.startsWith(marker, i) && !/\s/.test(text[i - 1] ?? "x")) return i;
  }
  return -1;
}

/** Parses `[label](url "title")`, returning null when it is not a link. */
function parseBracket(text, start) {
  let depth = 0;
  let i = start;
  for (; i < text.length; i++) {
    if (text[i] === "\\") {
      i++;
      continue;
    }
    if (text[i] === "[") depth++;
    else if (text[i] === "]") {
      depth--;
      if (depth === 0) break;
    }
  }
  if (depth !== 0) return null;

  const label = text.slice(start + 1, i);
  if (text[i + 1] !== "(") return null;

  let paren = 0;
  let j = i + 1;
  for (; j < text.length; j++) {
    if (text[j] === "\\") {
      j++;
      continue;
    }
    if (text[j] === "(") paren++;
    else if (text[j] === ")") {
      paren--;
      if (paren === 0) break;
    }
  }
  if (paren !== 0) return null;

  const inner = text.slice(i + 2, j).trim();
  const titled = /^(\S+)\s+["'(](.*)["')]$/.exec(inner);

  return {
    label,
    url: titled ? titled[1] : inner,
    title: titled ? titled[2] : null,
    end: j + 1,
  };
}

/* ── Assembly ─────────────────────────────────────────────────────────── */

function plainText(nodes) {
  return nodes
    .map((node) => {
      if (node.type === "text" || node.type === "inlineCode") return node.value;
      if (node.children) return plainText(node.children);
      return "";
    })
    .join("");
}

function uniqueId(base, ctx) {
  const seen = ctx.ids.get(base) ?? 0;
  ctx.ids.set(base, seen + 1);
  return seen ? `${base}-${seen}` : base;
}

/**
 * Parses a document body.
 *
 * Returns the root node, the h2/h3 headings for a table of contents, the
 * footnotes actually referenced (unreferenced definitions are dropped rather
 * than rendered as orphans), and a word count for the reading estimate.
 */
export function parseMarkdown(body) {
  const ctx = {
    headings: [],
    footnotes: [],
    refs: new Set(),
    ids: new Map(),
  };

  const lines = body.replace(/\r\n?/g, "\n").replace(/\t/g, "  ").split("\n");
  const children = parseBlocks(lines, ctx);

  const footnotes = ctx.footnotes.filter((note) => ctx.refs.has(note.id));
  const words = body
    .replace(/```[\s\S]*?```/g, "")
    .replace(/[#>*_`|-]/g, " ")
    .split(/\s+/)
    .filter(Boolean).length;

  return {
    ast: { type: "root", children, footnotes },
    headings: ctx.headings,
    wordCount: words,
  };
}

/**
 * Every relative asset path the document references, so the plugin knows
 * which files to import. Covers images, directive bodies and directive
 * attributes such as `poster=`.
 */
export function collectMedia(node, found = new Set()) {
  if (!node || typeof node !== "object") return found;

  if (node.type === "image" && isRelative(node.url)) found.add(clean(node.url));

  if (node.type === "directive") {
    for (const value of Object.values(node.attrs ?? {})) {
      if (typeof value === "string" && isRelative(value)) found.add(clean(value));
    }
    for (const line of node.value ?? []) {
      const name = line.split(/\s+/)[0];
      if (isRelative(name)) found.add(clean(name));
    }
  }

  for (const child of node.children ?? []) collectMedia(child, found);
  for (const note of node.footnotes ?? []) collectMedia(note, found);
  for (const row of node.rows ?? []) for (const cell of row) cell.forEach((c) => collectMedia(c, found));
  for (const cell of node.header ?? []) collectMedia(cell, found);

  return found;
}

const isRelative = (url) => typeof url === "string" && url && !/^(https?:|data:|mailto:|#|\/)/.test(url) && /\.[a-z0-9]{2,5}$/i.test(url);

const clean = (url) => url.replace(/^\.\//, "").split(/[?#]/)[0];
/* ═══════════════════════════════════════════════════════════════════════
   THEMES
   ═══════════════════════════════════════════════════════════════════════ */

/**
 * A theme is a flat object of design tokens. Every value becomes a CSS custom
 * property named `--{prefix}-{token}`, so anything you can express in CSS you
 * can put here — including `var(--your-own-token)` to inherit from a host
 * application's palette instead of hard-coding a colour.
 */
const BASE_TOKENS = {
  /* Type */
  "font-body": "ui-sans-serif, system-ui, -apple-system, sans-serif",
  "font-mono": "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace",
  "font-size": "16px",
  "line-height": "1.7",
  measure: "68ch",

  /* Shape */
  radius: "8px",
  space: "1.15em",
  "rule-width": "1px",

  /* Surfaces */
  bg: "transparent",
  fg: "#e6e9ee",
  muted: "#98a2b3",
  accent: "#5aa2f0",
  "accent-soft": "rgba(90, 162, 240, 0.15)",
  surface: "#1b1f25",
  border: "#2c333c",
  hairline: "#242a31",
  selection: "rgba(90, 162, 240, 0.3)",

  /* Code */
  "code-bg": "#1b1f25",
  "code-fg": "#e6e9ee",
  "code-inline-bg": "rgba(255, 255, 255, 0.07)",
  "code-size": "0.875em",
  gutter: "#5b6572",
  "hl-line": "rgba(90, 162, 240, 0.12)",
  "hl-edge": "#5aa2f0",

  /* Syntax tokens */
  "tok-key": "#c792ea",
  "tok-str": "#8fd68f",
  "tok-num": "#f2b263",
  "tok-com": "#6b7684",
  "tok-fn": "#6db3f2",
  "tok-type": "#5ecfd6",
  "tok-op": "#b6bec9",
  "tok-punc": "#8b95a1",
  "tok-var": "#e6e9ee",
  "tok-builtin": "#f0906b",

  /* Callouts */
  "callout-fill": "14%",
  "callout-label-shade": "#000",
  "callout-label-mix": "72%",
  "callout-label-light": "#fff",
  "callout-label-light-mix": "88%",
  "note-bg": "rgba(255, 255, 255, 0.03)",
  "note-accent": "#5f7086",
  "note-border": "#2c333c",
  "warn-border": "#d4674f",
  "tip-border": "#5aa2f0",
  "cal-yellow": "#e0a63a",
  "cal-orange": "#e08148",
  "cal-green": "#5cb87a",
  "cal-red": "#e0685a",
  "cal-purple": "#a98ae6",
  "cal-pink": "#e07aa8",
};

/** Built-in themes. Each is a patch over BASE_TOKENS. */
export const themes = {
  dark: {
    "callout-label-shade": "#fff",
    "callout-label-mix": "78%",
  },

  light: {
    bg: "transparent",
    fg: "#333a44",
    muted: "#69737f",
    accent: "#0e6579",
    "accent-soft": "rgba(14, 101, 121, 0.12)",
    surface: "#e8ecf0",
    border: "#d1d9e0",
    hairline: "#dfe4e9",
    selection: "rgba(14, 101, 121, 0.18)",
    "code-bg": "#edf0f3",
    "code-fg": "#2e353f",
    "code-inline-bg": "rgba(24, 42, 60, 0.07)",
    gutter: "#98a3af",
    "hl-line": "rgba(14, 101, 121, 0.1)",
    "hl-edge": "#0e6579",
    "tok-key": "#8639a6",
    "tok-str": "#1f7449",
    "tok-num": "#8f5510",
    "tok-com": "#7b8693",
    "tok-fn": "#1a5ba3",
    "tok-type": "#0d6c78",
    "tok-op": "#4b5560",
    "tok-punc": "#7b8693",
    "tok-var": "#2e353f",
    "tok-builtin": "#a04729",
    "note-bg": "rgba(20, 40, 60, 0.035)",
    "note-border": "#d1d9e0",
    "warn-accent": "#9c6b0c",
    "cal-yellow": "#9c6b0c",
    "cal-orange": "#a8541f",
    "cal-green": "#1f7449",
    "cal-red": "#b03a2c",
    "cal-purple": "#6b3fa8",
    "cal-pink": "#a83a6b",
  },
  /** Petrol & Paper — matches the app's index.css light palette. */
  petrol: {
    "font-body": "var(--font-sans, ui-sans-serif, system-ui, sans-serif)",
    bg: "transparent",
    fg: "oklch(0.245 0.012 75)",
    muted: "oklch(0.525 0.015 75)",
    accent: "oklch(0.485 0.085 205)",
    "accent-soft": "oklch(0.485 0.085 205 / 0.13)",
    surface: "oklch(0.951 0.009 85)",
    border: "oklch(0.898 0.009 80)",
    hairline: "oklch(0.925 0.008 82)",
    selection: "oklch(0.485 0.085 205 / 0.18)",
    "code-bg": "oklch(0.955 0.008 85)",
    "code-fg": "oklch(0.245 0.012 75)",
    "code-inline-bg": "oklch(0.245 0.012 75 / 0.07)",
    gutter: "oklch(0.7 0.012 80)",
    "hl-line": "oklch(0.485 0.085 205 / 0.1)",
    "hl-edge": "oklch(0.485 0.085 205)",
    "tok-key": "oklch(0.475 0.108 308)",
    "tok-str": "oklch(0.478 0.088 150)",
    "tok-num": "oklch(0.548 0.108 68)",
    "tok-com": "oklch(0.615 0.012 80)",
    "tok-fn": "oklch(0.518 0.098 248)",
    "tok-type": "oklch(0.478 0.082 205)",
    "tok-op": "oklch(0.452 0.014 75)",
    "tok-punc": "oklch(0.585 0.013 78)",
    "tok-var": "oklch(0.245 0.012 75)",
    "tok-builtin": "oklch(0.528 0.128 36)",
    "note-bg": "oklch(0.951 0.009 85)",
    "note-border": "oklch(0.898 0.009 80)",
    "warn-border": "oklch(0.552 0.168 27)",
    "tip-border": "oklch(0.485 0.085 205)",
    "cal-yellow": "oklch(0.578 0.128 78)",
    "cal-orange": "oklch(0.558 0.142 44)",
    "cal-green": "oklch(0.518 0.108 152)",
    "cal-red": "oklch(0.542 0.158 27)",
    "cal-purple": "oklch(0.502 0.132 300)",
    "cal-pink": "oklch(0.542 0.138 348)",
  },

  /** The .dark half of the same palette. */
  "petrol-dark": {
    "font-body": "var(--font-sans, ui-sans-serif, system-ui, sans-serif)",
    bg: "transparent",
    fg: "oklch(0.955 0.005 240)",
    muted: "oklch(0.715 0.017 242)",
    accent: "oklch(0.735 0.098 197)",
    "accent-soft": "oklch(0.735 0.098 197 / 0.16)",
    surface: "oklch(0.218 0.013 244)",
    border: "oklch(0.985 0.02 240 / 12%)",
    hairline: "oklch(0.985 0.02 240 / 8%)",
    selection: "oklch(0.735 0.098 197 / 0.28)",
    "code-bg": "oklch(0.218 0.013 244)",
    "code-fg": "oklch(0.955 0.005 240)",
    "code-inline-bg": "oklch(0.985 0.02 240 / 10%)",
    gutter: "oklch(0.505 0.015 244)",
    "hl-line": "oklch(0.735 0.098 197 / 0.12)",
    "hl-edge": "oklch(0.735 0.098 197)",
    "tok-key": "oklch(0.752 0.108 310)",
    "tok-str": "oklch(0.782 0.105 150)",
    "tok-num": "oklch(0.802 0.098 82)",
    "tok-com": "oklch(0.598 0.018 244)",
    "tok-fn": "oklch(0.742 0.095 250)",
    "tok-type": "oklch(0.782 0.088 195)",
    "tok-op": "oklch(0.782 0.012 240)",
    "tok-punc": "oklch(0.662 0.015 242)",
    "tok-var": "oklch(0.955 0.005 240)",
    "tok-builtin": "oklch(0.752 0.118 40)",
    "note-bg": "oklch(0.985 0.02 240 / 4%)",
    "note-border": "oklch(0.985 0.02 240 / 12%)",
    "warn-border": "oklch(0.658 0.168 25)",
    "tip-border": "oklch(0.735 0.098 197)",
  },
  /** Warm, low-contrast, for long reading. */
  paper: {
    fg: "#2b2620",
    muted: "#6d6459",
    accent: "#9a5518",
    "accent-soft": "rgba(154, 85, 24, 0.12)",
    surface: "#f4efe6",
    border: "#ded5c6",
    hairline: "#eae3d7",
    "font-body": 'Georgia, "Iowan Old Style", serif',
    "line-height": "1.75",
    "code-bg": "#f4efe6",
    "code-inline-bg": "rgba(0, 0, 0, 0.05)",
    "code-fg": "#2b2620",
    gutter: "#a99c8a",
    "hl-line": "rgba(154, 85, 24, 0.1)",
    "hl-edge": "#9a5518",
    "tok-key": "#8a3d6b",
    "tok-str": "#3f6b34",
    "tok-num": "#96591b",
    "tok-com": "#8d8375",
    "tok-fn": "#2f5d8f",
    "tok-type": "#1f6b70",
    "tok-op": "#5c5348",
    "tok-punc": "#8d8375",
    "tok-var": "#2b2620",
    "tok-builtin": "#a1512c",
    "cal-yellow": "oklch(0.578 0.128 78)",
    "cal-orange": "oklch(0.558 0.142 44)",
    "cal-green": "oklch(0.518 0.108 152)",
    "cal-red": "oklch(0.542 0.158 27)",
    "cal-purple": "oklch(0.502 0.132 300)",
    "cal-pink": "oklch(0.542 0.138 348)",
  },

  /** Inherits everything from the host page — no colours of its own. */
  inherit: {
    fg: "inherit",
    muted: "currentColor",
    bg: "transparent",
    surface: "rgba(127, 127, 127, 0.08)",
    "code-bg": "rgba(127, 127, 127, 0.08)",
    "code-inline-bg": "rgba(127, 127, 127, 0.14)",
    border: "rgba(127, 127, 127, 0.28)",
    hairline: "rgba(127, 127, 127, 0.18)",
  },
};

/** Merges a theme name, a token patch, or both, over the base tokens. */
export function resolveTheme(theme) {
  if (!theme) return { ...BASE_TOKENS };
  if (typeof theme === "string") return { ...BASE_TOKENS, ...(themes[theme] ?? {}) };
  const base = theme.extends ? resolveTheme(theme.extends) : { ...BASE_TOKENS };
  const patch = { ...theme };
  delete patch.extends;
  return { ...base, ...patch };
}

/**
 * Emits the complete stylesheet: the custom properties, then every rule the
 * renderer's markup depends on.
 *
 * Nothing here uses a reset or a utility framework, so the output drops into
 * any page. Every rule is scoped under `.{prefix}` so it cannot leak.
 */
export function themeCSS(theme = "dark", { prefix = "md", selector = null, varsOnly = false } = {}) {
  const t = resolveTheme(theme);
  const p = prefix;
  const root = selector ?? `.${p}`;
  const vars = Object.entries(t)
    .map(([key, value]) => `  --${p}-${key}: ${value};`)
    .join("\n");

  if (varsOnly) return `${root} {\n${vars}\n}\n`;

  return `${root} {
${vars}

  color: var(--${p}-fg);
  background: var(--${p}-bg);
  font-family: var(--${p}-font-body);
  font-size: var(--${p}-font-size);
  line-height: var(--${p}-line-height);
  max-width: var(--${p}-measure);
  overflow-wrap: break-word;
}

${root} ::selection { background: var(--${p}-selection); }
${root} > * + * { margin-top: var(--${p}-space); }
${root} > :first-child { margin-top: 0; }

/* Headings */
${root} h1, ${root} h2, ${root} h3,
${root} h4, ${root} h5, ${root} h6 {
  line-height: 1.25;
  font-weight: 600;
  letter-spacing: -0.015em;
  scroll-margin-top: 5rem;
  text-wrap: balance;
}
${root} h1 { font-size: 2em; margin-top: 1.6em; }
${root} h2 { font-size: 1.5em; margin-top: 1.8em; }
${root} h3 { font-size: 1.25em; margin-top: 1.6em; }
${root} h4 { font-size: 1.05em; margin-top: 1.4em; }
${root} h5, ${root} h6 { font-size: 1em; margin-top: 1.2em; }
${root} .${p}-anchor {
  color: var(--${p}-muted);
  text-decoration: none;
  margin-left: 0.4em;
  opacity: 0;
  transition: opacity 120ms ease;
}
${root} :is(h1, h2, h3, h4, h5, h6):hover .${p}-anchor,
${root} .${p}-anchor:focus-visible { opacity: 1; }

/* Text */
${root} a {
  color: var(--${p}-accent);
  text-decoration: underline;
  text-underline-offset: 2px;
  text-decoration-thickness: 1px;
}
${root} strong { font-weight: 650; }
${root} del { color: var(--${p}-muted); }
${root} hr {
  border: 0;
  border-top: var(--${p}-rule-width) solid var(--${p}-hairline);
  margin: 2.5em 0;
}
${root} blockquote {
  margin-inline: 0;
  padding-left: 1.1em;
  border-left: 2px solid var(--${p}-accent);
  color: var(--${p}-muted);
  font-style: italic;
}
${root} blockquote > * + * { margin-top: 0.7em; }

/* Lists */
${root} ul, ${root} ol { padding-left: 1.4em; }
${root} li + li { margin-top: 0.4em; }
${root} li > ul, ${root} li > ol { margin-top: 0.4em; }
${root} li::marker { color: var(--${p}-muted); }
${root} .${p}-task { list-style: none; margin-left: -1.4em; }
${root} .${p}-task input { margin-right: 0.5em; accent-color: var(--${p}-accent); }

/* Media */
${root} img, ${root} video { max-width: 100%; height: auto; border-radius: var(--${p}-radius); }
${root} figure { margin: 2em 0; }
${root} figcaption {
  margin-top: 0.6em;
  color: var(--${p}-muted);
  font-size: 0.875em;
}
${root} .${p}-gallery {
  display: grid;
  gap: 0.75rem;
  grid-template-columns: repeat(auto-fit, minmax(min(220px, 100%), 1fr));
  margin: 2em 0;
}

/* Tables */
${root} .${p}-table-wrap { overflow-x: auto; margin: 1.6em 0; }
${root} table { width: 100%; border-collapse: collapse; font-size: 0.9375em; }
${root} th {
  text-align: left;
  font-weight: 550;
  color: var(--${p}-muted);
  padding: 0 1em 0.5em 0;
  border-bottom: var(--${p}-rule-width) solid var(--${p}-border);
}
${root} td {
  padding: 0.5em 1em 0.5em 0;
  border-bottom: var(--${p}-rule-width) solid var(--${p}-hairline);
  vertical-align: top;
}

/* Code */
${root} code {
  font-family: var(--${p}-font-mono);
  font-size: var(--${p}-code-size);
}
${root} :not(pre) > code {
  background: var(--${p}-code-inline-bg);
  padding: 0.15em 0.4em;
  border-radius: calc(var(--${p}-radius) / 2);
}
${root} .${p}-code {
  position: relative;
  margin: 1.6em 0;
  background: var(--${p}-code-bg);
  color: var(--${p}-code-fg);
  border: var(--${p}-rule-width) solid var(--${p}-border);
  border-radius: var(--${p}-radius);
  overflow: hidden;
}
${root} .${p}-code-head {
  display: flex;
  align-items: center;
  gap: 0.75em;
  padding: 0.35em 0.45em 0.35em 0.95em;
  min-height: 2.8em;
  border-bottom: var(--${p}-rule-width) solid var(--${p}-hairline);
  color: var(--${p}-muted);
  font-family: var(--${p}-font-mono);
  font-size: 0.75em;
}
${root} .${p}-code-name { margin-right: auto; }
${root} .${p}-code-head .${p}-copy { position: static; font-size: 1em; margin-left: 0.4em; }

${root} .${p}-code pre {
  margin: 0;
  padding: 0.9em 0;
  overflow-x: auto;
  tab-size: 2;
  line-height: 1.6;
}
${root} .${p}-line { display: block; padding-inline: 0.9em; }
${root} .${p}-line[data-hl] {
  background: var(--${p}-hl-line);
  box-shadow: inset 2px 0 0 var(--${p}-hl-edge);
}
${root} .${p}-gutter {
  display: inline-block;
  width: 2.5ch;
  margin-right: 1.2em;
  text-align: right;
  color: var(--${p}-gutter);
  user-select: none;
}
${root} .${p}-copy {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex: none;
  width: 2.25em;
  height: 2.25em;
  padding: 0;
  font: inherit;
  color: var(--${p}-muted);
  background: transparent;
  border: var(--${p}-rule-width) solid transparent;
  border-radius: calc(var(--${p}-radius) / 2);
  cursor: pointer;
  transition: color 120ms ease, background 120ms ease, border-color 120ms ease;
}
${root} .${p}-copy svg { width: 1.4em; height: 1.4em; display: block; pointer-events: none; }
${root} .${p}-copy:hover {
  color: var(--${p}-fg);
  background: var(--${p}-code-inline-bg);
  border-color: var(--${p}-border);
}
${root} .${p}-copy[data-copied] { color: var(--${p}-tok-str); border-color: currentColor; }
${root} .${p}-copy:focus-visible { outline: 2px solid var(--${p}-accent); outline-offset: 1px; }
${root} .${p}-copy[data-copied] { color: var(--${p}-tok-str); }
@media (hover: none) {
  ${root} .${p}-copy { opacity: 1; }
}
${root} .${p}-code-bare .${p}-copy {
  position: absolute;
  top: 0.5em;
  right: 0.5em;
  z-index: 2;
  font-size: 0.875em;
  background: var(--${p}-surface);
  border-color: var(--${p}-border);
}
${root} .tok-key { color: var(--${p}-tok-key); }
${root} .tok-str { color: var(--${p}-tok-str); }
${root} .tok-num { color: var(--${p}-tok-num); }
${root} .tok-com { color: var(--${p}-tok-com); font-style: italic; }
${root} .tok-fn { color: var(--${p}-tok-fn); }
${root} .tok-type { color: var(--${p}-tok-type); }
${root} .tok-op { color: var(--${p}-tok-op); }
${root} .tok-punc { color: var(--${p}-tok-punc); }
${root} .tok-var { color: var(--${p}-tok-var); }
${root} .tok-builtin { color: var(--${p}-tok-builtin); }

/* Callouts */
${root} .${p}-callout {
  --cal: var(--${p}-note-border);
  margin: 1.6em 0;
  padding: 0.9em 1.1em;
  background: color-mix(in oklab, var(--cal) var(--${p}-callout-fill), transparent);
  border: var(--${p}-rule-width) solid color-mix(in oklab, var(--cal) 38%, transparent);
  border-radius: var(--${p}-radius);
  color: var(--cal);
  color: color-mix(in oklab, var(--cal) var(--${p}-callout-label-mix), var(--${p}-callout-label-shade));

}
${root} .${p}-callout > * + * { margin-top: 0.2em; }
${root} .${p}-callout-label {
  font-family: var(--${p}-font-mono);
  font-size: 1em;
  letter-spacing: 0.02em;
  font-weight: 650;
  color: var(--cal);
  color: color-mix(in oklab, var(--cal) var(--${p}-callout-label-light-mix), var(--${p}-callout-label-light));
}
${root} .${p}-callout-warning,
${root} .${p}-callout-yellow { --cal: var(--${p}-cal-yellow); }
${root} .${p}-callout-orange,
${root} .${p}-callout-caution { --cal: var(--${p}-cal-orange); }
${root} .${p}-callout-success,
${root} .${p}-callout-green { --cal: var(--${p}-cal-green); }
${root} .${p}-callout-destructive,
${root} .${p}-callout-danger,
${root} .${p}-callout-error,
${root} .${p}-callout-red { --cal: var(--${p}-cal-red); }
${root} .${p}-callout-purple { --cal: var(--${p}-cal-purple); }
${root} .${p}-callout-pink { --cal: var(--${p}-cal-pink); }
${root} .${p}-callout-tip,
${root} .${p}-callout-info,
${root} .${p}-callout-blue,
${root} .${p}-callout-finding { --cal: var(--${p}-tip-border); }
${root} .${p}-callout-note,
${root} .${p}-callout-aside { --cal: var(--${p}-muted); }
${root} details.${p}-details {
  border: var(--${p}-rule-width) solid var(--${p}-border);
  border-radius: var(--${p}-radius);
  padding: 0.7em 1em;
}
${root} details.${p}-details summary { cursor: pointer; font-weight: 550; }

/* Footnotes */
${root} .${p}-fnref { font-size: 0.75em; text-decoration: none; }
${root} .${p}-footnotes {
  margin-top: 3em;
  padding-top: 1.2em;
  border-top: var(--${p}-rule-width) solid var(--${p}-hairline);
  font-size: 0.9em;
  color: var(--${p}-muted);
}

/* Math */
${root} .math { font-family: var(--${p}-font-mono); line-height: 1.2; }
${root} .math-display {
  display: block;
  margin: 1.6em 0;
  text-align: center;
  overflow-x: auto;
  overflow-y: hidden;
  font-size: 1.05em;
}
${root} .math-inline { display: inline-block; vertical-align: baseline; padding-inline: 0.08em; }
${root} .math .mi { font-style: italic; padding-right: 0.02em; }
${root} .math .mo { padding-inline: 0.22em; }
${root} .math .mo-tight { padding-inline: 0.08em; }
${root} .math .mfrac {
  display: inline-flex;
  flex-direction: column;
  align-items: stretch;
  text-align: center;
  vertical-align: middle;
  padding-inline: 0.18em;
  font-size: 0.94em;
}
${root} .math .mfrac > span {
  padding-inline: 0.22em;
}
${root} .math .mfrac > span:first-child {
  padding-bottom: 0.12em;
}
${root} .math .mfrac > span:last-child {
  border-top: 1px solid currentColor;
  padding-top: 0.12em;
}
${root} .math .mover {
  display: inline-block;
  border-top: 1px solid currentColor;
  padding-top: 0.12em;
  margin-top: 0.12em;
}
${root} .math .munder {
  display: inline-block;
  border-bottom: 1px solid currentColor;
  padding-bottom: 0.1em;
}

${root} .math .msup, ${root} .math .msub { font-size: 0.74em; line-height: 1; }
${root} .math .msup { vertical-align: 0.48em; }
${root} .math .msub { vertical-align: -0.28em; }
${root} .math .msqrt {
  display: inline-flex;
  align-items: stretch;
  vertical-align: middle;
  padding-top: 0.08em;
}
${root} .math .msqrt > .radical {
  flex: none;
  width: 0.55em;
  align-self: stretch;
  overflow: visible;
}
${root} .math .msqrt > .radicand {
  border-top: 1px solid currentColor;
  padding: 0.16em 0.16em 0 0.08em;
}
${root} .math .msqrt > .mroot {
  align-self: flex-start;
  font-size: 0.6em;
  margin-right: -0.3em;
  z-index: 1;
}
${root} .math .mrow-paren { display: inline-flex; align-items: center; }
${root} .math .stretchy {
  display: inline-block;
  transform: scaleY(var(--stretch, 1));
  transform-origin: center;
  will-change: transform;
}
${root} .math .mrow-paren { align-items: center; }
${root} .math-error {
  color: var(--${p}-warn-border);
  font-family: var(--${p}-font-mono);
  border-bottom: 1px dotted currentColor;
}

@media (prefers-reduced-motion: reduce) {
  ${root} * { transition-duration: 0.001ms !important; }
}
`;
}

/* ═══════════════════════════════════════════════════════════════════════
   HTML RENDERER
   ═══════════════════════════════════════════════════════════════════════ */

const HTML_ESCAPES = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };
const escapeHtml = (text) => String(text ?? "").replace(/[&<>"']/g, (c) => HTML_ESCAPES[c]);

/** Blocks javascript: and data: URLs while leaving everything else alone. */
function safeUrl(url) {
  const trimmed = String(url ?? "").trim();
  if (/^(javascript|vbscript):/i.test(trimmed)) return "#";
  if (/^data:/i.test(trimmed) && !/^data:image\//i.test(trimmed)) return "#";
  return trimmed;
}

const attr = (name, value) => (value === undefined || value === null || value === false || value === "" ? "" : ` ${name}="${escapeHtml(value)}"`);

/**
 * Built-in container directives.
 *
 * Each receives the parsed node plus a helper bag and returns an HTML string.
 * Override or extend via `options.directives`; returning `null` falls through
 * to the generic callout.
 */
function defaultDirectives(p) {
  const callout = (node, h) => {
    const kind = node.attrs.type ?? (node.name === "note" ? "note" : node.name);
    const label = node.attrs.title ?? kind.charAt(0).toUpperCase() + kind.slice(1);
    return `<aside class="${p}-callout ${p}-callout-${escapeHtml(kind)}">` + `<p class="${p}-callout-label">${escapeHtml(label)}</p>` + h.blocks(node.children) + `</aside>`;
  };

  return {
    note: callout,
    warning: callout,
    tip: callout,
    finding: callout,
    aside: callout,
    info: callout,

    details: (node, h) => `<details class="${p}-details"><summary>${escapeHtml(node.attrs.title ?? "Details")}</summary>` + h.blocks(node.children) + `</details>`,

    figure: (node, h) => {
      const src = h.url(node.attrs.src);
      if (!src) return "";
      return `<figure><img${attr("src", src)}${attr("alt", node.attrs.alt ?? "")} loading="lazy" decoding="async">` + (node.attrs.caption ? `<figcaption>${escapeHtml(node.attrs.caption)}</figcaption>` : "") + `</figure>`;
    },

    gallery: (node, h) => {
      const items = (node.value ?? [])
        .map((line) => h.url(line.split(/\s+/)[0]))
        .filter(Boolean)
        .map((src) => `<img${attr("src", src)} alt="" loading="lazy" decoding="async">`)
        .join("");
      return items ? `<div class="${p}-gallery">${items}</div>` : "";
    },

    video: (node, h) => {
      const src = h.url(node.attrs.src ?? node.value?.[0]);
      if (!src) return "";
      const poster = h.url(node.attrs.poster);
      return (
        `<figure><video controls preload="none" playsinline${attr("poster", poster)}` +
        `${node.attrs.loop ? " loop" : ""}${attr("src", src)}></video>` +
        (node.attrs.caption ? `<figcaption>${escapeHtml(node.attrs.caption)}</figcaption>` : "") +
        `</figure>`
      );
    },

    audio: (node, h) => {
      const src = h.url(node.attrs.src ?? node.value?.[0]);
      return src ? `<figure><audio controls preload="none"${attr("src", src)}></audio></figure>` : "";
    },
  };
}

/**
 * Turns an AST into HTML.
 *
 * `options.renderers` can replace any node type; `options.directives` any
 * container. Both receive a helper bag so an override can recurse without
 * reaching into internals.
 */
function createHtmlRenderer(options) {
  const p = options.prefix;
  const directives = { ...defaultDirectives(p), ...(options.directives ?? {}) };
  const overrides = options.renderers ?? {};
  const url = (raw) => (raw ? safeUrl(options.resolveUrl(raw)) : "");

  const helpers = {
    blocks: (nodes) => blocks(nodes),
    inline: (nodes) => inline(nodes),
    url,
    escape: escapeHtml,
    attr,
    prefix: p,
  };

  function inline(nodes) {
    return (nodes ?? []).map(one).join("");
  }

  function one(node) {
    const override = overrides[node.type];
    if (override) {
      const result = override(node, helpers);
      if (result !== null && result !== undefined) return result;
    }

    switch (node.type) {
      case "text":
        return escapeHtml(node.value);
      case "strong":
        return `<strong>${inline(node.children)}</strong>`;
      case "emphasis":
        return `<em>${inline(node.children)}</em>`;
      case "delete":
        return `<del>${inline(node.children)}</del>`;
      case "inlineCode":
        return `<code>${escapeHtml(node.value)}</code>`;
      case "break":
        return "<br>";
      case "math":
        return node.html;

      case "link": {
        const href = url(node.url);
        const external = /^https?:/i.test(href) && options.externalLinks;
        return `<a${attr("href", href)}${attr("title", node.title)}` + (external ? ' target="_blank" rel="noreferrer noopener"' : "") + `>${inline(node.children)}</a>`;
      }

      case "image": {
        const src = url(node.url);
        return `<img${attr("src", src)}${attr("alt", node.alt ?? "")}${attr("title", node.title)}` + ` loading="lazy" decoding="async">`;
      }

      case "footnoteRef":
        return `<sup id="ref-${escapeHtml(node.id)}">` + `<a class="${p}-fnref" href="#fn-${escapeHtml(node.id)}">[${escapeHtml(node.id)}]</a></sup>`;

      default:
        return "";
    }
  }

  function blocks(nodes) {
    return (nodes ?? []).map(block).join("\n");
  }

  function block(node) {
    const override = overrides[node.type];
    if (override) {
      const result = override(node, helpers);
      if (result !== null && result !== undefined) return result;
    }

    switch (node.type) {
      case "paragraph": {
        // A lone image becomes a figure rather than sitting inside a <p>,
        // which would be invalid once a caption is added.
        if (node.children.length === 1 && node.children[0].type === "image") {
          return `<figure>${one(node.children[0])}</figure>`;
        }
        return `<p>${inline(node.children)}</p>`;
      }

      case "heading": {
        const level = Math.min(node.depth, 6);
        const anchor = options.anchors ? `<a class="${p}-anchor" href="#${escapeHtml(node.id)}" aria-label="Link to this section">#</a>` : "";
        return `<h${level} id="${escapeHtml(node.id)}">${inline(node.children)}${anchor}</h${level}>`;
      }

      case "list": {
        const tag = node.ordered ? "ol" : "ul";
        const start = node.ordered && node.start !== 1 ? attr("start", node.start) : "";
        const items = node.children
          .map((item) => {
            const checkbox = item.checked === null ? "" : `<input type="checkbox" disabled${item.checked ? " checked" : ""}>`;
            const cls = item.checked === null ? "" : ` class="${p}-task"`;
            // Tight lists drop the paragraph wrapper, which is what keeps a
            // simple bullet list from being double-spaced.
            const body = node.tight && item.children.length === 1 && item.children[0].type === "paragraph" ? inline(item.children[0].children) : blocks(item.children);
            return `<li${cls}>${checkbox}${body}</li>`;
          })
          .join("");
        return `<${tag}${start}>${items}</${tag}>`;
      }

      case "blockquote":
        return `<blockquote>${blocks(node.children)}</blockquote>`;

      case "thematicBreak":
        return "<hr>";

      case "math":
        return node.html;

      case "code":
        return renderCode(node, p, options);

      case "table": {
        const head = node.header.map((cell, i) => `<th${attr("style", node.align[i] ? `text-align:${node.align[i]}` : "")}>${inline(cell)}</th>`).join("");
        const body = node.rows.map((row) => "<tr>" + row.map((cell, i) => `<td${attr("style", node.align[i] ? `text-align:${node.align[i]}` : "")}>${inline(cell)}</td>`).join("") + "</tr>").join("");
        return `<div class="${p}-table-wrap"><table><thead><tr>${head}</tr></thead><tbody>${body}</tbody></table></div>`;
      }

      case "directive": {
        const handler = directives[node.name];
        if (handler) {
          const result = handler(node, helpers);
          if (result !== null && result !== undefined) return result;
        }
        return directives.note(node, helpers);
      }

      default:
        return "";
    }
  }

  function footnotes(notes) {
    if (!notes?.length) return "";
    const items = notes.map((note) => `<li id="fn-${escapeHtml(note.id)}">${inline(note.children)} ` + `<a href="#ref-${escapeHtml(note.id)}" aria-label="Back to reference">&#8617;</a></li>`).join("");
    return `<section class="${p}-footnotes"><ol>${items}</ol></section>`;
  }

  return { blocks, inline, footnotes };
}

const COPY_ICON = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>`;

const CHECK_ICON = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="M20 6 9 17l-5-5"/></svg>`;

function renderCode(node, p, options) {
  const showNumbers = options.lineNumbers === "auto" ? node.numbers : Boolean(options.lineNumbers);
  const highlighted = new Set(node.highlight ?? []);

  const hasHead = Boolean(node.filename || (node.lang && options.showLanguage));

  const copy = options.copyButton ? `<button type="button" class="${p}-copy" data-${p}-copy aria-label="Copy code" title="Copy code">${COPY_ICON}</button>` : "";

  const head = hasHead ? `<div class="${p}-code-head"><span class="${p}-code-name">${escapeHtml(node.filename ?? node.lang)}</span>` + (node.filename && node.lang ? `<span>${escapeHtml(node.lang)}</span>` : "") + copy + `</div>` : "";
  const lines = node.lines
    .map((line, i) => {
      const gutter = showNumbers ? `<span class="${p}-gutter">${i + 1}</span>` : "";
      const content = line.map((token) => (token.c ? `<span class="tok-${token.c}">${escapeHtml(token.t)}</span>` : escapeHtml(token.t))).join("");
      const flag = highlighted.has(i + 1) ? " data-hl" : "";
      return `<span class="${p}-line"${flag}>${gutter}${content}\n</span>`;
    })
    .join("");

  return `<div class="${p}-code${hasHead ? "" : ` ${p}-code-bare`}"${attr("data-lang", node.lang)}>${head}${hasHead ? "" : copy}<pre><code>${lines}</code></pre></div>`;
}

/* ═══════════════════════════════════════════════════════════════════════
   PUBLIC API
   ═══════════════════════════════════════════════════════════════════════ */

const DEFAULT_OPTIONS = {
  /** Theme name, token object, or `{ extends: 'dark', accent: '#f00' }`. */
  theme: "light",
  /** Optional second theme emitted as a vars-only override. */
  darkTheme: null,
  /** Selector the dark tokens are scoped to. Defaults to `.dark .{prefix}`. */
  darkSelector: null,
  /** Root selector override for the base theme. */
  selector: null,
  /** Class and CSS-variable namespace. Change it to avoid collisions. */
  prefix: "md",
  /** Add a `#` anchor link to every heading. */
  anchors: true,
  /** Add target=_blank to http(s) links. */
  externalLinks: true,
  /** true, false, or 'auto' (numbers appear above four lines). */
  lineNumbers: "auto",
  /** Render a copy button. You wire the click handler; see the README. */
  copyButton: true,
  autoCopy: true,
  /** Show the language name in the code header when there is no filename. */
  showLanguage: true,
  /** Rewrite every URL: resolve relative media, add a CDN prefix, and so on. */
  resolveUrl: (url) => url,
  /** Words per minute for the reading estimate. */
  wpm: 220,
  /** Per-node-type render overrides. */
  renderers: null,
  /** Extra or replacement `:::name` containers. */
  directives: null,
};

/**
 * Builds a configured renderer.
 *
 * Construct once and reuse: the theme CSS is generated a single time, and the
 * language tables are already built at module load.
 *
 *   const md = createMarkdown({ theme: 'dark' });
 *   document.head.insertAdjacentHTML('beforeend', `<style>${md.css}</style>`);
 *   el.className = 'md';
 *   el.innerHTML = md.render(source).html;
 */
export function createMarkdown(userOptions = {}) {
  const options = { ...DEFAULT_OPTIONS, ...userOptions };
  const renderer = createHtmlRenderer(options);
  if (options.autoCopy && options.copyButton) installCopyHandler(options.prefix);
  const base = options.selector ?? `.${options.prefix}`;
  const css =
    themeCSS(options.theme, { prefix: options.prefix, selector: options.selector }) +
    (options.darkTheme
      ? themeCSS(options.darkTheme, {
          prefix: options.prefix,
          selector: options.darkSelector ?? `.dark ${base}, .dark${base}`,
          varsOnly: true,
        })
      : "");

  function parse(source) {
    const { data, body } = parseFrontmatter(String(source ?? ""));
    const { ast, headings, wordCount } = parseMarkdown(body);
    return {
      meta: data,
      ast,
      headings,
      wordCount,
      readingTime: Math.max(1, Math.round(wordCount / options.wpm)),
    };
  }

  function render(source) {
    const parsed = parse(source);
    const html = renderer.blocks(parsed.ast.children) + renderer.footnotes(parsed.ast.footnotes);
    return { ...parsed, html, toc: buildToc(parsed.headings) };
  }

  return {
    render,
    parse,
    css,
    theme: resolveTheme(options.theme),
    options,
    /** Renders an already-parsed AST — useful when parsing happened at build time. */
    renderAst: (ast) => renderer.blocks(ast.children) + renderer.footnotes(ast.footnotes),
  };
}

/** One-shot convenience wrapper. Prefer createMarkdown when rendering repeatedly. */
export function renderMarkdown(source, options = {}) {
  return createMarkdown(options).render(source);
}

/** Nests a flat heading list into a tree, for a table of contents. */
export function buildToc(headings) {
  const root = [];
  const stack = [{ depth: 0, children: root }];
  for (const heading of headings) {
    const node = { ...heading, children: [] };
    while (stack.length > 1 && stack[stack.length - 1].depth >= heading.depth) stack.pop();
    stack[stack.length - 1].children.push(node);
    stack.push(node);
  }
  return root;
}

const COPY_HANDLER_INSTALLED = new Set();

/**
 * Installs one delegated listener on the document, once per prefix. Called
 * automatically by createMarkdown in the browser, so copy buttons work no
 * matter how or how often the markup is mounted.
 */
export function installCopyHandler(prefix = "md") {
  if (typeof document === "undefined" || COPY_HANDLER_INSTALLED.has(prefix)) return;
  COPY_HANDLER_INSTALLED.add(prefix);
  attachCopyButtons(document, { prefix });
}

/**
 * Wires up copy buttons inside a rendered container. Browser-only, and
 * entirely optional — the markup works without it.
 */
export function attachCopyButtons(container, { prefix = "md" } = {}) {
  const handler = async (event) => {
    const button = event.target.closest(`[data-${prefix}-copy]`);
    if (!button || !container.contains(button)) return;
    const code = button.closest(`.${prefix}-code`)?.querySelector("code");
    if (!code) return;
    // Each .{prefix}-line ends in a newline, so textContent keeps the line
    // structure once the gutter spans are dropped.
    const clone = code.cloneNode(true);
    clone.querySelectorAll(`.${prefix}-gutter`).forEach((n) => n.remove());
    const text = clone.textContent.replace(/\n$/, "");
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
      } else {
        // http:// origins have no async clipboard; this still works there.
        const scratch = document.createElement("textarea");
        scratch.value = text;
        scratch.setAttribute("readonly", "");
        scratch.style.cssText = "position:fixed;top:-9999px;opacity:0";
        document.body.appendChild(scratch);
        scratch.select();
        document.execCommand("copy");
        scratch.remove();
      }
      button.innerHTML = CHECK_ICON;
      button.setAttribute("data-copied", "");
      button.setAttribute("aria-label", "Copied");
      clearTimeout(button._resetTimer);
      button._resetTimer = setTimeout(() => {
        button.innerHTML = COPY_ICON;
        button.removeAttribute("data-copied");
        button.setAttribute("aria-label", "Copy code");
      }, 1500);
    } catch {
      /* Clipboard blocked; the text is still selectable. */
    }
  };
  container.addEventListener("click", handler);
  return () => container.removeEventListener("click", handler);
}

export default createMarkdown;
