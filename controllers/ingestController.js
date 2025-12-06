const {PrismaClient} = require('@prisma/client');
const axios = require('axios');
const prisma = new PrismaClient();


const syncProducts = async (req, res) => {
    try {
        console.log("Starting Multi-Tenant Product Sync...");
        const tenants = await prisma.tenant.findMany();
        const results = [];

        if (tenants.length === 0) {
            console.log("No tenants found to sync.");
            return res.status(200).json({ message: "No tenants found." });
        }

        for (const tenant of tenants) {
            try {
                const shopDomain = tenant.shopDomain;
                const accessToken = tenant.accessToken;

                console.log(`Syncing Products for: ${shopDomain}`);

                const url = `https://${shopDomain}/admin/api/2025-01/products.json`;
                
                const response = await axios.get(url, {
                    headers: {
                        'X-Shopify-Access-Token': accessToken,
                        'Content-Type': 'application/json'
                    }
                });

                const products = response.data.products;

                for (const product of products) {
                    const variants = product.variants || [];
                    const firstVariant = variants.length > 0 ? variants[0] : null;
                    const price = firstVariant ? firstVariant.price : "0.00";

                    await prisma.product.upsert({
                        where: { shopifyId: BigInt(product.id) },
                        update: {
                            title: product.title,
                            price: price,
                            shopId: shopDomain 
                        },
                        create: {
                            shopifyId: BigInt(product.id),
                            title: product.title,
                            price: price,
                            shopId: shopDomain
                        }
                    });
                }
                results.push({ shop: shopDomain, status: 'success', count: products.length });

            } catch (tenantError) {
                console.error(`Error syncing tenant ${tenant.shopDomain}:`, tenantError.message);
                results.push({ shop: tenant.shopDomain, status: 'failed', error: tenantError.message });
            }
        }
        console.log("Product Sync Complete for all tenants");
        res.status(200).json({ success: true, results: results });

    } catch (error) {
        console.error("Critical Error in Sync Logic", error);
        res.status(500).json({ success: false, error: error.message });
    }
}

const syncCustomers = async (req, res) => {
    try {
        console.log("Starting Multi-Tenant Customer Sync...");
        const tenants = await prisma.tenant.findMany();
        const results = [];

        for (const tenant of tenants) {
            try {
                const shopDomain = tenant.shopDomain;
                const accessToken = tenant.accessToken;

                const url = `https://${shopDomain}/admin/api/2025-01/customers.json`;
                const response = await axios.get(url, {
                    headers: {
                        'X-Shopify-Access-Token': accessToken,
                        'Content-Type': 'application/json'
                    }
                });

                const customers = response.data.customers;

                for (const customer of customers) {
                    const city = customer.default_address ? customer.default_address.city : null;
                    const country = customer.default_address ? customer.default_address.country : null;

                    await prisma.customer.upsert({
                        where: { shopifyId: BigInt(customer.id) },
                        update: {
                            firstName: customer.first_name,
                            lastName: customer.last_name,
                            email: customer.email,
                            city: city,
                            country: country,
                            totalSpent: customer.total_spent || "0.00",
                            shopId: shopDomain
                        },
                        create: {
                            shopifyId: BigInt(customer.id),
                            firstName: customer.first_name,
                            lastName: customer.last_name,
                            email: customer.email,
                            city: city,
                            country: country,
                            totalSpent: customer.total_spent || "0.00",
                            shopId: shopDomain
                        }
                    });
                }
                results.push({ shop: shopDomain, status: 'success', count: customers.length });

            } catch (tenantError) {
                console.error(`Error syncing customers for ${tenant.shopDomain}:`, tenantError.message);
                results.push({ shop: tenant.shopDomain, status: 'failed', error: tenantError.message });
            }
        }

        res.status(200).json({ success: true, results: results });

    } catch (error) {
        console.error("Critical Error in Customer Sync", error.message);
        res.status(500).json({ success: false, error: error.message });
    }
};

const syncOrders = async (req, res) => {
    try {
        console.log("Starting Multi-Tenant Order Sync...");
        const tenants = await prisma.tenant.findMany();
        const results = [];

        for (const tenant of tenants) {
            try {
                const shopDomain = tenant.shopDomain;
                const accessToken = tenant.accessToken;

                const url = `https://${shopDomain}/admin/api/2025-01/orders.json?status=any`; 
                const response = await axios.get(url, {
                    headers: {
                        'X-Shopify-Access-Token': accessToken,
                        'Content-Type': 'application/json'
                    }
                });

                const orders = response.data.orders;

                for (const order of orders) {
                    let dbCustomer = null;
                    if (order.customer) {
                        dbCustomer = await prisma.customer.findUnique({
                            where: { shopifyId: BigInt(order.customer.id) }
                        });
                    }
                    const internalCustomerId = dbCustomer ? dbCustomer.id : null;

                    await prisma.order.upsert({
                        where: { shopifyId: BigInt(order.id) },
                        update: {
                            totalPrice: order.total_price,
                            status: order.financial_status,
                            customerId: internalCustomerId, 
                            shopId: shopDomain
                        },
                        create: {
                            shopifyId: BigInt(order.id),
                            totalPrice: order.total_price,
                            status: order.financial_status,
                            customerId: internalCustomerId, 
                            shopId: shopDomain,
                            createdAt: new Date(order.created_at) 
                        }
                    });
                }
                results.push({ shop: shopDomain, status: 'success', count: orders.length });

            } catch (tenantError) {
                console.error(`Error syncing orders for ${tenant.shopDomain}:`, tenantError.message);
                results.push({ shop: tenant.shopDomain, status: 'failed', error: tenantError.message });
            }
        }

        res.status(200).json({ success: true, results: results });

    } catch (error) {
        console.error("Critical Error in Order Sync", error.message);
        res.status(500).json({ success: false, error: error.message });
    }
};

module.exports = { syncProducts, syncCustomers, syncOrders };