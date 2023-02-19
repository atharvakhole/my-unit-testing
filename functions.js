const functions = {
  isNull: () => null,
  checkValue: (x) => x,
  createUser: (firstName, lastName) => {
    const user = {
      firstName: firstName,
      lastName: lastName,
    };
    return user;
  },
};

module.exports = functions;
