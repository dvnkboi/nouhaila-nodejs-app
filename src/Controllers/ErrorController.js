export const error = (err, req, res, next) => {
  res.render('Error.ejs', {
    error: err.message,
  });
};