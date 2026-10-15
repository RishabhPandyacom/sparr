/**
 * Static coding-challenge bank. Grading is AI-review-only (no code execution),
 * so these carry a clear problem statement + starter code per language.
 */

export type CodingChallenge = {
  id: string;
  title: string;
  prompt: string;
  starter: Record<string, string>; // language -> starter code
};

export const CODING_LANGUAGES = ["javascript", "python", "java"] as const;
export type CodingLanguage = (typeof CODING_LANGUAGES)[number];

export const codingChallenges: CodingChallenge[] = [
  {
    id: "two-sum",
    title: "Two Sum",
    prompt:
      "Given an array of integers `nums` and an integer `target`, return the indices of the two numbers that add up to `target`. You may assume exactly one solution exists and you may not use the same element twice. Aim for O(n) time.",
    starter: {
      javascript: `/**
 * @param {number[]} nums
 * @param {number} target
 * @return {number[]}
 */
function twoSum(nums, target) {
  // your code here
}
`,
      python: `def two_sum(nums, target):
    # your code here
    pass
`,
      java: `class Solution {
    public int[] twoSum(int[] nums, int target) {
        // your code here
    }
}
`,
    },
  },
  {
    id: "valid-parentheses",
    title: "Valid Parentheses",
    prompt:
      "Given a string `s` containing just the characters '()[]{}', determine if the input is valid. Brackets must be closed in the correct order and every opening bracket must have a matching closing bracket of the same type.",
    starter: {
      javascript: `/**
 * @param {string} s
 * @return {boolean}
 */
function isValid(s) {
  // your code here
}
`,
      python: `def is_valid(s):
    # your code here
    pass
`,
      java: `class Solution {
    public boolean isValid(String s) {
        // your code here
    }
}
`,
    },
  },
  {
    id: "fizzbuzz",
    title: "Fizz Buzz",
    prompt:
      "Return an array of strings for numbers 1..n where multiples of 3 are 'Fizz', multiples of 5 are 'Buzz', multiples of both are 'FizzBuzz', and everything else is the number as a string.",
    starter: {
      javascript: `/**
 * @param {number} n
 * @return {string[]}
 */
function fizzBuzz(n) {
  // your code here
}
`,
      python: `def fizz_buzz(n):
    # your code here
    pass
`,
      java: `import java.util.*;
class Solution {
    public List<String> fizzBuzz(int n) {
        // your code here
    }
}
`,
    },
  },
];

export function pickCodingChallenge(seed?: string): CodingChallenge {
  if (seed) {
    const found = codingChallenges.find((c) => c.id === seed);
    if (found) return found;
  }
  const i = Math.floor(Math.random() * codingChallenges.length);
  return codingChallenges[i];
}
