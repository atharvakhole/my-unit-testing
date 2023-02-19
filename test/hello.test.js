const add = require("../add");
const functions = require("../functions");
const hello = require("../hello");

test('Should return "Hello <name>"', () => {
  expect(hello("John")).toEqual("Hello John");
});

test("Add 2 + 2 to return 4", () => {
  expect(add(2, 2)).toBe(4);
});

test("Test if isNull is null", () => {
  expect(functions.isNull()).toBeNull();
});

test("Should be falsy", () => {
  expect(functions.checkValue(undefined)).toBeFalsy();
});

// Test objects
test("Should return an object with first name and last name", () => {
  expect(functions.createUser("John", "Doe")).toEqual({
    firstName: "John",
    lastName: "Doe",
  });
});

// Less than greater than
test("Should be less than 10", () => {
  let load1 = 4,
    load2 = 5;
  expect(load1 + load2).toBeLessThan(10);
});
