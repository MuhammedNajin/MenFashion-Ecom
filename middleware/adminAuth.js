module.exports.islogin = (req, res, next) => {
  try {
    console.log("islogin middleware", req.session.admin);
    if (req.session.admin) {
      next();
    } else {
      res.redirect("/admin/login");
    }
  } catch (error) {}
};

module.exports.logged = (req, res, next) => {
  try {
    if (!req.session.admin) {
      next();
    } else {
      res.redirect("/admin/");
    }
  } catch (error) {
    console.log(error);
  }
};
