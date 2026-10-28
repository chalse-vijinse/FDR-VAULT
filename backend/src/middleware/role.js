export function requireRole(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Unauthorized. Authentication required.' });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Access denied. Role '${req.user.role}' lacks permissions for this action. Required: ${allowedRoles.join(', ')}`
      });
    }

    next();
  };
}

export function enforceInstitutionScope(req, res, next) {
  // If Super Admin or Verification Officer, can access all
  if (req.user.role === 'SUPER_ADMIN' || req.user.role === 'VERIFICATION_OFFICER') {
    return next();
  }

  // If Institution Admin, check if req has institution_id in params or body
  const targetInstId = req.params.institutionId || req.body.institution_id || req.query.institution_id;
  if (targetInstId && String(targetInstId) !== String(req.user.institution_id)) {
    return res.status(403).json({
      success: false,
      message: 'Access Denied: You are not authorized to view or manage records for another institution.'
    });
  }

  next();
}

export default {
  requireRole,
  enforceInstitutionScope
};
