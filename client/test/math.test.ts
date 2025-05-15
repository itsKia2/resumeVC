import { test, expect, describe } from 'bun:test';

// Simple function to add two numbers
function add(a: number, b: number): number {
  return a + b;
}

describe('Math Functions', () => {
  test('add function correctly adds two numbers', () => {
    expect(add(2, 2)).toBe(4);
  });

  test('add function works with negative numbers', () => {
    expect(add(-1, 5)).toBe(4);
  });
});