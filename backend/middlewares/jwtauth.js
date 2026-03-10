// middleware/verifyToken.js

const jwt = require('jsonwebtoken');
const User = require('../models/users');

/**
 * Middleware to verify JWT signature, expiration, user existence (soft-delete),
 * and tokenVersion matching for device-based logout.
 */
async function verifyToken(req, res, next) {
  // 1. Extract token from Authorization header
  const authHeader = req.header('Authorization');
  if (!authHeader) {
    console.log('No token found');
    return res.status(401).json({ message: 'No token, authorization denied' });
  }

  // 2. Remove "Bearer " prefix if present
  const actualToken = authHeader.startsWith('Bearer ')
    ? authHeader.slice(7)
    : authHeader;

  try {
    // 3. Verify signature & expiration
    // decoded payload will include: { userId, deviceToken, tokenVersion, iat, exp }
    const decoded = jwt.verify(actualToken, process.env.JWT_SECRET);

    // 4. Look up the user in the database
    const user = await User.findById(decoded.userId);
    if (!user || user.isDeleted === 1) {
      console.log('User is deleted or not found');
      return res.status(401).json({ message: 'User account is deleted' });
    }

    // 5. Find the matching device sub-document
    //    (each device entry has: { deviceToken, deviceType, tokenVersion })
    const deviceRecord = user.devices.find(
      (d) => d.deviceToken === decoded.deviceToken
    );
    if (!deviceRecord) {
      console.log('Device token not found for this user');
      return res
        .status(401)
        .json({ message: 'Invalid device or already logged out' });
    }

    // 6. Compare tokenVersion from JWT payload vs. database
    if (deviceRecord.tokenVersion !== decoded.tokenVersion) {
      console.log(
        `Token version mismatch. Payload: ${decoded.tokenVersion}, DB: ${deviceRecord.tokenVersion}`
      );
      return res
        .status(401)
        .json({ message: 'Token is no longer valid (version mismatch)' });
    }

    // 7. Everything checks out: attach user info to req.user
    req.user = {
      userId: decoded.userId,
      deviceToken: decoded.deviceToken,
      tokenVersion: decoded.tokenVersion
      // (you can add any other fields you need here)
    };

    // Proceed to next middleware or route handler
    next();
  } catch (err) {
    if (err instanceof jwt.TokenExpiredError) {
      console.error('JWT expired error');
      return res.status(401).json({ message: 'Token has expired' });
    }

    console.error('Invalid token error:', err.message);
    return res.status(401).json({ message: 'Token is not valid' });
  }
}

module.exports = verifyToken;
