// Copyright 2025 Synnax Labs, Inc.
//
// Use of this software is governed by the Business Source License included in the file
// licenses/BSL.txt.
//
// As of the Change Date specified in that file, in accordance with the Business Source
// License, use of this software will be governed by the Apache License, Version 2.0,
// included in the file licenses/APL.txt.

import { describe, expect, it } from "vitest";

import { createShortIdentifiers, naturalLanguageJoin } from "@/strings/strings";

describe("naturalLanguageJoin", () => {
  it("should return an empty string for an empty array", () =>
    expect(naturalLanguageJoin([])).toBe(""));

  it("should return the zeroLength string for an empty array if provided", () =>
    expect(naturalLanguageJoin([], "No items")).toBe("No items"));

  it("should return the single element for an array with one element", () =>
    expect(naturalLanguageJoin(["apple"])).toBe("apple"));

  it('should join two elements with "and"', () =>
    expect(naturalLanguageJoin(["apple", "banana"])).toBe("apple and banana"));

  it('should join multiple elements with commas and "and"', () =>
    expect(naturalLanguageJoin(["apple", "banana", "cherry"])).toBe(
      "apple, banana, and cherry",
    ));

  it("should handle an array with more than three elements correctly", () =>
    expect(naturalLanguageJoin(["apple", "banana", "cherry", "date"])).toBe(
      "apple, banana, cherry, and date",
    ));
});

describe("createShortIdentifiers", () => {
  it("should create identifiers for a single word", () =>
    expect(createShortIdentifiers("Bob")).toEqual(expect.arrayContaining(["bob"])));

  it("should create identifiers for multiple words", () =>
    expect(createShortIdentifiers("John Doe")).toEqual(
      expect.arrayContaining(["jd", "j_d", "johdoe", "joh_doe"]),
    ));

  it("should create identifiers for words containing numbers", () =>
    expect(createShortIdentifiers("Alice 123")).toEqual(
      expect.arrayContaining(["a1", "a_1", "ali123", "ali_123"]),
    ));

  it("should create identifiers for words longer than three characters", () =>
    expect(createShortIdentifiers("Jonathan")).toEqual(
      expect.arrayContaining(["jon"]),
    ));

  it("should create identifiers for words shorter than three characters", () =>
    expect(createShortIdentifiers("Al")).toEqual(expect.arrayContaining(["al"])));

  it("should create identifiers for mixed cases", () =>
    expect(createShortIdentifiers("Alice Bob")).toEqual(
      expect.arrayContaining(["ab", "a_b", "alibob", "ali_bob"]),
    ));
});
