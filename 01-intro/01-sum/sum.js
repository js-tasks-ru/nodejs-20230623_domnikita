function sum(a, b) {
  if (!isNumber(a) || !isNumber(b)) {
    throw new TypeError();
  }

  return a + b;
}

function isNumber(x) {
  return typeof x === 'number';
}

module.exports = sum;
