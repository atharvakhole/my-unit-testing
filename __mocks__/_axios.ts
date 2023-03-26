const axios = {
  get: jest.fn(() =>
    Promise.resolve({
      data: {
        meals: [
          {
            idMeal: "1",
            strMeal: "Scrambled eggs",
            strMealThumb:
              "https://www.themealdb.com/images/media/meals/ysqupp1511553350.jpg",
          },
          {
            idMeal: "2",
            strMeal: "Egg salad",
            strMealThumb:
              "https://www.themealdb.com/images/media/meals/uwvtpv1511296276.jpg",
          },
        ],
      },
    })
  ),
};

export default axios;
