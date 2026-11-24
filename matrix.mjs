export const transpose = matrix => matrix[0].map((_, col) => matrix.map(row => row[col]));

export function multiply(left, right) {
  if (left[0].length !== right.length) throw new RangeError('矩阵内维度必须相等');
  return left.map(row => right[0].map((_, col) =>
    row.reduce((sum, value, index) => sum + value * right[index][col], 0)));
}

export const add = (left, right) => left.map((row, i) => row.map((value, j) => value + right[i][j]));
export const determinant = ([[a, b], [c, d]]) => a * d - b * c;
export const adjugate = ([[a, b], [c, d]]) => [[d, -b], [-c, a]];
export const transform = (matrix, vector) => multiply(matrix, vector.map(value => [value])).flat();

export function replaceColumn(matrix, col, values) {
  return matrix.map((row, i) => row.map((value, j) => j === col ? values[i] : value));
}

export function split(matrix, row, col) {
  return [matrix.slice(0, row), matrix.slice(row)].map(rows => [
    rows.map(line => line.slice(0, col)),
    rows.map(line => line.slice(col)),
  ]);
}

export function fraction(numerator, denominator = 1) {
  if (!numerator) return '0';
  const negative = numerator * denominator < 0;
  let a = Math.abs(numerator);
  let b = Math.abs(denominator);
  while (b) [a, b] = [b, a % b];
  const top = Math.abs(numerator) / a;
  const bottom = Math.abs(denominator) / a;
  return `${negative ? '−' : ''}${top}${bottom === 1 ? '' : `/${bottom}`}`;
}

export function parseNumber(value) {
  const text = value.trim().replace(/[−－]/g, '-').replace(/／/g, '/').replace(/．/g, '.');
  const parts = text.split('/').map(part => part.trim());
  if (parts.length > 2 || parts.some(part => !/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)$/.test(part))) return NaN;
  const result = Number(parts[0]) / (parts.length === 2 ? Number(parts[1]) : 1);
  return Number.isFinite(result) ? result : NaN;
}

export const equalsAnswer = (value, expected) => Math.abs(parseNumber(value) - expected) <= 1e-6;
