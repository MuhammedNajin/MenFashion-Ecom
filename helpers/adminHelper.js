const Order = require("../models/order");
const Cetagory = require("../models/cetagory");

function bestSelling(sort) {
  try {
    console.log(sort, "sort");
    return new Promise(async (resolve, reject) => {
      const bestSellingTopTen = await Order.aggregate([
        {
          $lookup: {
            from: "products",
            localField: "products.productId",
            foreignField: "_id",
            as: "products",
          },
        },
        {
          $unwind: "$products",
        },
        {
          $match: {
            status: "placed",
          },
        },

        {
          $group: {
            _id: { category: `$products.${sort}` },
            count: { $sum: 1 },
            data: { $first: "$$ROOT" },
          },
        },
        {
          $sort: { count: -1 },
        },
        {
          $limit: 10,
        },
      ]);

      if (!bestSellingTopTen) reject(new Error(`data did'nt recived`));
      resolve(bestSellingTopTen);
    });
  } catch (error) {
    console.log(error);
  }
}

function mapCategory(cetagory) {

  console.log(cetagory, "cetagory");
  return new Promise((resolve, reject) => {
    const topTenCetagory = [];
    if(cetagory.length == 0) return resolve([])
    if (!cetagory) reject(new Error(`data did'nt recived`));
    cetagory.forEach(async (el, i) => {
      const cat = await Cetagory.findById({ _id: el._id.category });
      topTenCetagory.push(cat.name);
      if (i == cetagory.length - 1) {
        resolve(topTenCetagory);
      }
    });
  });
}

module.exports = {
  bestSelling,
  mapCategory,
};
