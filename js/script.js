/* ============ Element references ============ */
const html = document.documentElement;
const themeToggle = document.getElementById('themeToggle');

const tabs = document.querySelectorAll('.tab');
const calculatorPanel = document.getElementById('calculatorPanel');
const converterPanel = document.getElementById('converterPanel');

const displayBox = document.getElementById('displayBox');
const displayPrevious = document.getElementById('displayPrevious');
const displayCurrent = document.getElementById('displayCurrent');
const copyToast = document.getElementById('copyToast');

const sciToggle = document.getElementById('sciToggle');
const scientificRow = document.getElementById('scientificRow');

const memoryIndicator = document.getElementById('memoryIndicator');

const historyList = document.getElementById('historyList');
const historyEmpty = document.getElementById('historyEmpty');
const clearHistoryBtn = document.getElementById('clearHistory');
const exportHistoryBtn = document.getElementById('exportHistory');
const historySearchInput = document.getElementById('historySearch');

const allButtons = document.querySelectorAll('.btn');

/* ============ Theme (dark mode) ============ */
function applyTheme(theme) {
  html.setAttribute('data-theme', theme);
  themeToggle.textContent = theme === 'dark' ? '☀️' : '🌙';
  try { localStorage.setItem('calc-theme', theme); } catch (e) {}
}

(function initTheme() {
  let saved = null;
  try { saved = localStorage.getItem('calc-theme'); } catch (e) {}
  const preferred = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  applyTheme(saved || preferred);
})();

themeToggle.addEventListener('click', () => {
  const current = html.getAttribute('data-theme');
  applyTheme(current === 'dark' ? 'light' : 'dark');
});

/* ============ Mode tabs (Calculator / Converter) ============ */
tabs.forEach(tab => {
  tab.addEventListener('click', () => {
    tabs.forEach(t => { t.classList.remove('active'); t.setAttribute('aria-selected', 'false'); });
    tab.classList.add('active');
    tab.setAttribute('aria-selected', 'true');
    const mode = tab.dataset.mode;
    calculatorPanel.hidden = mode !== 'calculator';
    converterPanel.hidden = mode !== 'converter';
  });
});

/* ============ Scientific row toggle ============ */
sciToggle.addEventListener('click', () => {
  const willShow = scientificRow.hidden;
  scientificRow.hidden = !willShow;
  sciToggle.setAttribute('aria-pressed', String(willShow));
});

/* ============ Calculator state ============ */
let expr = '';
let justEvaluated = false;
let lastEvaluatedLabel = '';

let history = [];
try { history = JSON.parse(localStorage.getItem('calc-history') || '[]'); } catch (e) { history = []; }

let memoryValue = 0;
try { memoryValue = parseFloat(localStorage.getItem('calc-memory')) || 0; } catch (e) { memoryValue = 0; }

/* ============ Safe expression evaluation ============ */
function sinDeg(x) { return Math.sin(x * Math.PI / 180); }
function cosDeg(x) { return Math.cos(x * Math.PI / 180); }
function tanDeg(x) { return Math.tan(x * Math.PI / 180); }

function roundResult(num) {
  return Math.round(num * 1e10) / 1e10;
}

function safeEval(rawExpr) {
  if (!rawExpr) return 0;

  const jsExpr = rawExpr
    .replace(/×/g, '*')
    .replace(/÷/g, '/')
    .replace(/−/g, '-')
    .replace(/π/g, '(3.141592653589793)')
    .replace(/\^/g, '**');

  // Only allow characters/identifiers we expect to see in a built expression.
  if (!/^[0-9+\-*/().\s%a-z]*$/i.test(jsExpr)) return 'Error';

  try {
    const fn = new Function('sin', 'cos', 'tan', 'sqrt', `return (${jsExpr});`);
    const result = fn(sinDeg, cosDeg, tanDeg, Math.sqrt);
    if (typeof result !== 'number' || !isFinite(result)) return 'Error';
    return roundResult(result);
  } catch (e) {
    return 'Error';
  }
}

/* ============ Expression builders ============ */
function resetIfJustEvaluated() {
  if (justEvaluated) {
    expr = '';
    justEvaluated = false;
    lastEvaluatedLabel = '';
  }
}

function appendNumber(digit) {
  resetIfJustEvaluated();
  expr += digit;
}

function appendDecimal() {
  resetIfJustEvaluated();
  const match = expr.match(/([0-9.]*)$/);
  if (match && match[1].includes('.')) return;
  expr += expr === '' || /[+\-×÷(]$/.test(expr) ? '0.' : '.';
}

function appendOperator(op) {
  if (expr === '' && op !== '−') return; // can't start with +,×,÷ (allow leading minus)
  justEvaluated = false;
  lastEvaluatedLabel = '';
  if (/[+\-×÷]$/.test(expr)) {
    expr = expr.slice(0, -1) + op;
  } else {
    expr += op;
  }
}

function appendFunc(name) {
  resetIfJustEvaluated();
  expr += name + '(';
}

function appendParen(p) {
  resetIfJustEvaluated();
  expr += p;
}

function appendPi() {
  resetIfJustEvaluated();
  expr += 'π';
}

function applySquare() {
  if (!expr) return;
  expr += '^2';
}

function applyPercent() {
  const match = expr.match(/([0-9.]+)$/);
  if (!match) return;
  const num = parseFloat(match[1]);
  const start = match.index;
  expr = expr.slice(0, start) + '(' + (num / 100) + ')';
}

function toggleSign() {
  const match = expr.match(/([0-9.]+)$/);
  if (!match) return;
  const start = match.index;
  const numStr = match[1];
  const before = expr.slice(0, start);
  if (before.endsWith('-')) {
    // undo a sign we added ourselves (ASCII hyphen only — '−' is the subtraction operator)
    expr = before.slice(0, -1) + numStr;
  } else {
    expr = before + '-' + numStr;
  }
}

function clearAll() {
  expr = '';
  justEvaluated = false;
  lastEvaluatedLabel = '';
}

function deleteLast() {
  expr = expr.slice(0, -1);
  justEvaluated = false;
  lastEvaluatedLabel = '';
}

function evaluateExpression() {
  if (!expr) return;
  const result = safeEval(expr);
  addHistoryEntry(expr, result);
  lastEvaluatedLabel = expr + ' =';
  expr = result === 'Error' ? '' : String(result);
  justEvaluated = true;
}

/* ============ Memory ============ */
function currentNumericValue() {
  if (expr) {
    const val = safeEval(expr);
    return typeof val === 'number' ? val : 0;
  }
  const parsed = parseFloat(displayCurrent.textContent);
  return isNaN(parsed) ? 0 : parsed;
}

function handleMemory(action) {
  const currentNum = currentNumericValue();
  switch (action) {
    case 'mc':
      memoryValue = 0;
      break;
    case 'mr':
      expr = String(memoryValue);
      justEvaluated = false;
      lastEvaluatedLabel = '';
      break;
    case 'm+':
      memoryValue += currentNum;
      break;
    case 'm-':
      memoryValue -= currentNum;
      break;
  }
  try { localStorage.setItem('calc-memory', memoryValue); } catch (e) {}
  memoryIndicator.hidden = memoryValue === 0;
}

/* ============ History ============ */
let historyFilter = '';

function saveHistory() {
  try { localStorage.setItem('calc-history', JSON.stringify(history)); } catch (e) {}
}

function addHistoryEntry(exprUsed, result) {
  history.unshift({ expr: exprUsed, result: result, ts: Date.now() });
  if (history.length > 50) history = history.slice(0, 50);
  saveHistory();
  renderHistory();
}

function renderHistory() {
  const filtered = historyFilter
    ? history.filter(entry =>
        entry.expr.toLowerCase().includes(historyFilter) ||
        String(entry.result).toLowerCase().includes(historyFilter)
      )
    : history;

  historyList.innerHTML = '';

  if (history.length === 0) {
    historyEmpty.textContent = 'No calculations yet';
    historyEmpty.hidden = false;
  } else if (filtered.length === 0) {
    historyEmpty.textContent = 'No matches';
    historyEmpty.hidden = false;
  } else {
    historyEmpty.hidden = true;
  }

  exportHistoryBtn.disabled = history.length === 0;

  filtered.forEach(entry => {
    const li = document.createElement('li');

    const exprSpan = document.createElement('span');
    exprSpan.className = 'h-expr';
    exprSpan.textContent = entry.expr + ' =';

    const resultSpan = document.createElement('span');
    resultSpan.className = 'h-result';
    resultSpan.textContent = entry.result;

    li.appendChild(exprSpan);
    li.appendChild(resultSpan);

    if (entry.ts) {
      li.title = new Date(entry.ts).toLocaleString();
    }

    li.addEventListener('click', () => {
      expr = String(entry.result);
      justEvaluated = false;
      lastEvaluatedLabel = '';
      updateDisplay();
    });

    historyList.appendChild(li);
  });
}

function exportHistoryAsCSV() {
  if (history.length === 0) return;

  const rows = [['Expression', 'Result', 'Date']];
  // Oldest first, so the file reads top-to-bottom in the order calculations happened.
  const chronological = history.slice().reverse();
  chronological.forEach(entry => {
    const dateStr = entry.ts ? new Date(entry.ts).toLocaleString() : '';
    rows.push([entry.expr, String(entry.result), dateStr]);
  });

  const csv = rows
    .map(row => row.map(field => `"${String(field).replace(/"/g, '""')}"`).join(','))
    .join('\n');

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  const stamp = new Date().toISOString().slice(0, 10);
  a.href = url;
  a.download = `calculator-history-${stamp}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

clearHistoryBtn.addEventListener('click', () => {
  history = [];
  saveHistory();
  renderHistory();
});

exportHistoryBtn.addEventListener('click', exportHistoryAsCSV);

historySearchInput.addEventListener('input', (e) => {
  historyFilter = e.target.value.trim().toLowerCase();
  renderHistory();
});

/* ============ Display ============ */
function updateDisplay() {
  displayCurrent.textContent = expr === '' ? '0' : expr;
  displayPrevious.textContent = justEvaluated ? lastEvaluatedLabel : '';
}

/* ============ Copy to clipboard ============ */
displayBox.addEventListener('click', () => {
  const text = displayCurrent.textContent;
  if (!navigator.clipboard) return;
  navigator.clipboard.writeText(text).then(() => {
    copyToast.hidden = false;
    copyToast.classList.add('show');
    setTimeout(() => {
      copyToast.classList.remove('show');
      setTimeout(() => { copyToast.hidden = true; }, 200);
    }, 900);
  }).catch(() => {});
});

/* ============ Button click feedback ============ */
function pulse(el) {
  if (!el) return;
  el.classList.add('pulse');
  setTimeout(() => el.classList.remove('pulse'), 120);
}

/* ============ Action dispatch ============ */
function handleAction(action, value, btnEl) {
  switch (action) {
    case 'number': appendNumber(value); break;
    case 'decimal': appendDecimal(); break;
    case 'operator': appendOperator(value); break;
    case 'equals': evaluateExpression(); break;
    case 'clear': clearAll(); break;
    case 'delete': deleteLast(); break;
    case 'percent': applyPercent(); break;
    case 'sign': toggleSign(); break;
    case 'square': applySquare(); break;
    case 'paren': appendParen(value); break;
    case 'pi': appendPi(); break;
    case 'func': appendFunc(value); break;
    case 'memory': handleMemory(value); break;
  }
  updateDisplay();
  pulse(btnEl);
}

allButtons.forEach(btn => {
  btn.addEventListener('click', () => {
    handleAction(btn.dataset.action, btn.dataset.value, btn);
  });
});

/* ============ Keyboard support ============ */
function findBtn(selector) {
  return document.querySelector(selector);
}

window.addEventListener('keydown', (e) => {
  const key = e.key;

  if (key >= '0' && key <= '9') {
    handleAction('number', key, findBtn(`.btn[data-action="number"][data-value="${key}"]`));
  } else if (key === '.') {
    handleAction('decimal', '.', findBtn('.btn[data-action="decimal"]'));
  } else if (key === '+') {
    handleAction('operator', '+', findBtn('.btn[data-action="operator"][data-value="+"]'));
  } else if (key === '-') {
    handleAction('operator', '−', findBtn('.btn[data-action="operator"][data-value="−"]'));
  } else if (key === '*') {
    handleAction('operator', '×', findBtn('.btn[data-action="operator"][data-value="×"]'));
  } else if (key === '/') {
    e.preventDefault();
    handleAction('operator', '÷', findBtn('.btn[data-action="operator"][data-value="÷"]'));
  } else if (key === '%') {
    handleAction('percent', null, findBtn('.btn[data-action="percent"]'));
  } else if (key === '(' || key === ')') {
    handleAction('paren', key, findBtn(`.btn[data-action="paren"][data-value="${key}"]`));
  } else if (key === 'Enter' || key === '=') {
    e.preventDefault();
    handleAction('equals', null, findBtn('.btn[data-action="equals"]'));
  } else if (key === 'Backspace') {
    handleAction('delete', null, findBtn('.btn[data-action="delete"]'));
  } else if (key === 'Escape') {
    handleAction('clear', null, findBtn('.btn[data-action="clear"]'));
  }
});

/* ============ Init calculator UI ============ */
memoryIndicator.hidden = memoryValue === 0;
renderHistory();
updateDisplay();

/* ============ Unit converter ============ */
const unitData = {
  length: {
    kind: 'factor',
    base: 'm',
    units: { mm: 0.001, cm: 0.01, m: 1, km: 1000, in: 0.0254, ft: 0.3048, yd: 0.9144, mi: 1609.344 },
    labels: { mm: 'Millimeters', cm: 'Centimeters', m: 'Meters', km: 'Kilometers', in: 'Inches', ft: 'Feet', yd: 'Yards', mi: 'Miles' }
  },
  weight: {
    kind: 'factor',
    units: { mg: 0.001, g: 1, kg: 1000, oz: 28.3495, lb: 453.592 },
    labels: { mg: 'Milligrams', g: 'Grams', kg: 'Kilograms', oz: 'Ounces', lb: 'Pounds' }
  },
  temperature: {
    kind: 'temperature',
    units: { c: 'c', f: 'f', k: 'k' },
    labels: { c: 'Celsius', f: 'Fahrenheit', k: 'Kelvin' }
  }
};

function toCelsius(value, unit) {
  if (unit === 'c') return value;
  if (unit === 'f') return (value - 32) * 5 / 9;
  if (unit === 'k') return value - 273.15;
}

function fromCelsius(value, unit) {
  if (unit === 'c') return value;
  if (unit === 'f') return value * 9 / 5 + 32;
  if (unit === 'k') return value + 273.15;
}

const convTabs = document.querySelectorAll('.conv-tab');
const convFromValue = document.getElementById('convFromValue');
const convToValue = document.getElementById('convToValue');
const convFromUnit = document.getElementById('convFromUnit');
const convToUnit = document.getElementById('convToUnit');

let currentCategory = 'length';

function populateUnitSelects(category) {
  const data = unitData[category];
  const keys = Object.keys(data.units);

  convFromUnit.innerHTML = '';
  convToUnit.innerHTML = '';

  keys.forEach(key => {
    const label = data.labels[key];
    const opt1 = new Option(label, key);
    const opt2 = new Option(label, key);
    convFromUnit.appendChild(opt1);
    convToUnit.appendChild(opt2);
  });

  convFromUnit.value = keys[0];
  convToUnit.value = keys.length > 1 ? keys[1] : keys[0];
}

function formatConverterResult(num) {
  if (!isFinite(num)) return 'Error';
  const rounded = Math.round(num * 1e6) / 1e6;
  return rounded.toString();
}

function runConversion() {
  const data = unitData[currentCategory];
  const value = parseFloat(convFromValue.value);

  if (isNaN(value)) {
    convToValue.value = '';
    return;
  }

  const fromUnit = convFromUnit.value;
  const toUnit = convToUnit.value;
  let result;

  if (data.kind === 'temperature') {
    const celsius = toCelsius(value, fromUnit);
    result = fromCelsius(celsius, toUnit);
  } else {
    const base = value * data.units[fromUnit];
    result = base / data.units[toUnit];
  }

  convToValue.value = formatConverterResult(result);
}

convTabs.forEach(tab => {
  tab.addEventListener('click', () => {
    convTabs.forEach(t => { t.classList.remove('active'); t.setAttribute('aria-selected', 'false'); });
    tab.classList.add('active');
    tab.setAttribute('aria-selected', 'true');
    currentCategory = tab.dataset.category;
    populateUnitSelects(currentCategory);
    runConversion();
  });
});

convFromValue.addEventListener('input', runConversion);
convFromUnit.addEventListener('change', runConversion);
convToUnit.addEventListener('change', runConversion);

populateUnitSelects(currentCategory);
runConversion();

/* ============ PWA: register service worker ============ */
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('service-worker.js').catch(() => {
      // Fails silently when served over file:// or without HTTPS — that's expected locally.
    });
  });
}
