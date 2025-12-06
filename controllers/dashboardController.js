const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const getShopId = (req) => {
    return req.headers['x-shop-id'];
};


const getStats = async (req, res) => {
    try {
        const shopId = getShopId(req);
        
        if (!shopId) {
            return res.status(400).json({ error: "No Shop ID provided in headers" });
        }

        const customerCount = await prisma.customer.count({
            where: { shopId: shopId } 
        });

        const orderCount = await prisma.order.count({
            where: { shopId: shopId } 
        });

        const orders = await prisma.order.findMany({
            where: { shopId: shopId }, 
            select: { totalPrice: true }
        });

        const totalRevenue = orders.reduce((sum, order) => {
            return sum + parseFloat(order.totalPrice || "0");
        }, 0);

        res.json({
            totalCustomers: customerCount,
            totalOrders: orderCount,
            totalRevenue: totalRevenue.toFixed(2)
        });

    } catch (error) {
        console.error("Cannot get stats", error);
        res.status(500).json({ error: error.message });
    }
};


const getSalesOverTime = async (req, res) => {
    try {
        const shopId = getShopId(req);
        if (!shopId) return res.status(400).json({ error: "No Shop ID provided" });

        const orders = await prisma.order.findMany({
            where: { shopId: shopId }, 
            select: { createdAt: true, totalPrice: true },
            orderBy: { createdAt: 'asc' }
        });

        const salesByDate = {};

        orders.forEach(order => {
            const date = new Date(order.createdAt).toISOString().split('T')[0];
            if (!salesByDate[date]) {
                salesByDate[date] = 0;
            }
            salesByDate[date] += parseFloat(order.totalPrice || '0');
        });

        const chartData = Object.keys(salesByDate).map(date => ({
            date,
            amount: salesByDate[date]
        }));
        
        res.json(chartData);

    } catch (error) {
        console.error("Cannot get sales chart", error);
        res.status(500).json({ error: error.message });
    }
};


const getTopCustomers = async (req, res) => {
    try {
        const shopId = getShopId(req);
        if (!shopId) return res.status(400).json({ error: "No Shop ID provided" });

        const customers = await prisma.customer.findMany({
            where: { shopId: shopId } 
        });

        const sortedCustomers = customers.sort((a, b) => {
            return parseFloat(b.totalSpent) - parseFloat(a.totalSpent);
        });

        const top5 = sortedCustomers.slice(0, 5);

        const serializedCustomers = top5.map(customer => ({
            ...customer,
            shopifyId: customer.shopifyId.toString()
        }));

        res.json(serializedCustomers);

    } catch (error) {
        console.error("Cannot get top customers", error);
        res.status(500).json({ error: error.message });
    }
};

module.exports = { getStats, getSalesOverTime, getTopCustomers };