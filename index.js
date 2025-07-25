console.log('Script starting...');
const express = require('express');
const { BlobServiceClient } = require('@azure/storage-blob');
console.log('Modules loaded');
const app = express();

app.use(express.json());
app.use(express.static(__dirname));

const connectionString = 'DefaultEndpointsProtocol=https;AccountName=revvsafetyusdata;AccountKey=pBnOCEu5zixCBzjORNd1KndafZdFxfS/mNIvePFd/jmxENyLuPk5+7op6cmZ1Vux1bModboz4V+C+ASt+ZjdaQ==;EndpointSuffix=core.windows.net'; // Replace with Central US string
console.log('Connection string set');
const containerName = 'reports';
try {
    const blobServiceClient = BlobServiceClient.fromConnectionString(connectionString);
    const containerClient = blobServiceClient.getContainerClient(containerName);
    console.log('Blob service client initialized');

    async function ensureContainer() {
        console.log('Ensuring container...');
        const createContainerResponse = await containerClient.createIfNotExists();
        if (createContainerResponse.succeeded) {
            console.log('Container created or already exists');
        }
    }
    ensureContainer().catch(err => console.error('Container setup error:', err));
} catch (err) {
    console.error('Failed to initialize Blob service:', err);
    process.exit(1);
}

app.post('/save-report', async (req, res) => {
    console.log('Received POST /save-report:', req.body);
    const report = req.body;
    const blobName = `${Date.now()}-${report.site}.json`;
    const blockBlobClient = containerClient.getBlockBlobClient(blobName);
    try {
        await blockBlobClient.uploadData(JSON.stringify(report, null, 2), {
            blobHTTPHeaders: { blobContentType: 'application/json' }
        });
        console.log('Report saved to blob:', blobName);
        res.send('Report saved successfully!');
    } catch (error) {
        console.error('Error saving report:', error.message, error.stack);
        res.status(500).send('Error saving report: ' + error.message);
    }
});

app.get('/', (req, res) => {
    res.sendFile(__dirname + '/index.html');
});

console.log('Environment port:', process.env.PORT);
const port = process.env.WEB_SITE_PORT || 80; // Use WEB_SITE_PORT or 80
app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});