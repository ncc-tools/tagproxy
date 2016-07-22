/**
 * Send Ok when ping
 * For testing and monitoring
 */
exports.sendOk = function sendOk(req, res, next) {
    res.send({ ok: true });
    return next();
};


/**
 * Pong: send the data received straight back
 * For testing only
 */
exports.pong = function pong(req, res, next) {
    res.send({pong: req.body});
    return next();
};
