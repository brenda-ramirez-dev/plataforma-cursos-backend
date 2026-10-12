const jwt = require('jsonwebtoken');

const verifyToken = (req, res, next) => {
    // Busca el token en los headers de la petición
    const token = req.headers['authorization'];
    if (!token) {
        return res.status(403).json({ success: false, message: 'No se proporcionó un token de acceso.' });
    }

    try {
        // Separa la palabra "Bearer" del token en sí
        const tokenString = token.split(" ")[1] || token;
        const decoded = jwt.verify(tokenString, process.env.JWT_SECRET);
        req.user = decoded; // Guarda los datos del usuario en la petición
        next(); // Permite que la petición continúe hacia el controlador
    } catch (error) {
        return res.status(401).json({ success: false, message: 'Token inválido o expirado.' });
    }
};

module.exports = { verifyToken };