const advancedResults = (model, populate) => async (req, res, next) => {
  let query;

  let reqQuery = { ...req.query };

  //only find results not marked as deleted by default it searches for non deleted but can search for deleted if deleted = true in params

  if (!reqQuery.deleted) reqQuery.deleted = false;

  // fields to exclude

  const removeFields = ["select", "sort", "page", "limit"];

  //loop to remove fields and delete from reqQuery

  removeFields.forEach((param) => delete reqQuery[param]);

  let queryStr = JSON.stringify(reqQuery);

  // adding $ to certian valuers
  queryStr = queryStr.replace(
    /\b(gt|gte|lt|lte|in)\b/g,
    (match) => `$${match}`
  );
  // queryStr = JSON.parse(queryStr);

  query = model.find(JSON.parse(queryStr));

  //select fields
  if (req.query.select) {
    const fields = req.query.select.split(",").join(" ");
    query = query.select(fields);
  }

  //sort
  let sortBy;
  if (req.query.sort) {
    sortBy = req.query.sort.split(",").join(" ");
    query = query.sort(sortBy);
  } else {
    query = query.sort("-createdAt");
  }

  // pagination
  let page = parseInt(req.query.page, 10) || 1;
  let limit = parseInt(req.query.limit, 10) || 10;
  if (req.query.page === "All") {
    limit = 500;
  }
  const startIndex = (page - 1) * limit;
  const endIndex = page * limit;
  const total = await model.countDocuments({
    deleted: !reqQuery.deleted ? false : true,
  });

  query = query.skip(startIndex).limit(limit);

  //populate
  if (populate) {
    query = query.populate(populate);
  }

  const results = await query;

  let totalPages = Math.ceil(total / limit);

  //pagination res
  const pagination = {};
  pagination.total = totalPages;
  pagination.totalRows = total;
  pagination.current = page;
  if (endIndex < total) {
    pagination.next = {
      page: page + 1,
      limit,
    };
  }

  if (startIndex > 0) {
    pagination.prev = {
      page: page - 1,
      limit,
    };
  }

  pagination.limit = limit;

  res.advancedResults = {
    success: true,
    count: results.length,
    pagination,
    data: results,
    sortBy: sortBy ? sortBy : "-createdAt",
  };

  next();
};

module.exports = advancedResults;
