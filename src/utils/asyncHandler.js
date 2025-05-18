export const asyncHandler = (fn) => {
    return (req, res, next) => {
        Promise.resolve(fn(req, res, next)).catch((err) => {
            const status = typeof err.statusCode === 'number' ? err.statusCode : 500;

            res.status(status).json({
                success: false,
                message: err.message || "Internal Server Error",
            });
        });
    };
};
