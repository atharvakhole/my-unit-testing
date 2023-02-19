const hello = require("../hello");

test('Should return "Hello <name>"', () => {
  expect(hello("John")).toEqual("Hello John");
});
