function requireAuth(req, res, next) {
    if (req.session && req.session.userId) {
        return next();
    }
    res.redirect('/login');
}

function requireAdmin(req, res, next) {
    if (req.session && req.session.role === 'admin') {
        return next();
    }
    res.status(403).json({error: 'Access denied. Admins only.'});
}

function requireCoordinator(req, res, next) {
    if (req.session && (req.session.role === 'coordinator' || req.session.role === 'admin')) {
        return next();
    }
    res.status(403).json({ error: 'Access denied. Coordinators only.' });
}

module.exports = { requireAuth, requireAdmin, requireCoordinator };