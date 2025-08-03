const prisma = require('../../database/prisma');
const { errorResponse } = require('../utils/response_handler');

class AuthMiddleware {
    // Verify JWT token
    static async verifyToken(req, res, next) {
        // Allow login and register without token
        if (
            req.path === '/api/auth/login' ||
            req.path === '/api/auth/register'
        ) {
            return next();
        }

        const phone = req.headers['x-phone'];
        const token = req.headers['x-token'];

        if (!phone || !token) {
            return errorResponse(res, 'Phone and token required', 401);
        }

        // Find user by phone and token
        const user = await prisma.getClient().user.findUnique({
            where: { phone },
            include: {
                role: {
                    include: {
                        permissions: {
                            include: {
                                permission: true
                            }
                        }
                    }
                }
            }
        });

        if (!user || user.token !== token) {
            return errorResponse(res, 'Invalid token or phone', 777);
        }

        if (user.status !== 'ACTIVE') {
            return errorResponse(res, 'User account is not active', 777);
        }

        req.user = user;
        next();
    }

}


module.exports = AuthMiddleware;