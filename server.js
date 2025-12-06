const express = require("express");
const cors = require("cors");
const cron = require('node-cron');
require('dotenv').config();
const ingestRoutes = require('./routes/ingestRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const authRoute = require ('./routes/authRoute');
const { syncProducts, syncCustomers, syncOrders } = require('./controllers/ingestController');

const app = express();
const Port = process.env.PORT;

app.use(cors());
app.use(express.json());

app.get('/',(req,res)=>{
    res.send("Api is running");
});
app.use('/api', authRoute);
app.use('/api/ingest', ingestRoutes);
app.use('/api/dashboard', dashboardRoutes);

cron.schedule('*/2 * * * *', async () => {
    console.log('--- 🔄 Scheduled Data Sync Started ---');
    
    try {
        const mockReq = {};
        const mockRes = {
            status: (code) => ({
                json: (data) => console.log(`   [Sync Status ${code}]: Success`)
            }),
            json: (data) => console.log(`   [Sync Success]: operation complete`)
        };

        console.log('1. Syncing Products...');
        await syncProducts(mockReq, mockRes);
        
        console.log('2. Syncing Customers...');
        await syncCustomers(mockReq, mockRes);
        
        console.log('3. Syncing Orders...');
        await syncOrders(mockReq, mockRes);
        
        console.log('--- ✅ Scheduled Sync Complete ---');
        
    } catch (error) {
        console.error('❌ Scheduled Sync Failed:', error.message);
    }
});

app.listen(Port,()=>{
    console.log(`Backend Server running on the port ${Port}`);
})
