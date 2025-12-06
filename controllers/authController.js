const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs'); 
const prisma = new PrismaClient();

const login = async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ error: "Please provide email and password" });
    }

    try {
 
        const tenant = await prisma.tenant.findUnique({
            where: { email }
        });

        if (!tenant) {
            return res.status(401).json({ error: "Invalid email or password" });
        }
        const isMatch = await bcrypt.compare(password, tenant.password);

        if (!isMatch) {
            return res.status(401).json({ error: "Invalid email or password" });
        }
        res.json({
            success: true,
            email: tenant.email,
            shopDomain: tenant.shopDomain
        });

    } catch (error) {
        console.error("Login Error:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
};

module.exports = { login };