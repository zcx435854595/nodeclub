var svgCaptcha = require('svg-captcha');

var index = function (req, res, next) {
  var captcha = svgCaptcha.create({
    width: 100,
    height: 35
  });
  req.session.captcha = captcha.text;
  
	res.type('svg');
	res.status(200).send(captcha.data);
}

exports.index = index;
