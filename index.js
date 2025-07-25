const express = require('express');
const { BlobServiceClient } = require('@azure/storage-blob');
const app = express();

app.use(express.json());
app.use(express.static(__dirname));

const connectionString = 'DefaultEndpointsProtocol=https;AccountName=revvsafetyusdata;AccountKey=pBnOCEu5zixCBzjORNd1KndafZdFxfS/mNIvePFd/jmxENyLuPk5+7op6cmZ1Vux1bModboz4V+C+ASt+ZjdaQ==;EndpointSuffix=core.windows.net'; // Replace with Central US string
const containerName = 'reports';
const blobServiceClient = BlobServiceClient.fromConnectionString(connectionString);
const containerClient = blobServiceClient.getContainerClient(containerName);

async function ensureContainer() {
    console.log('Ensuring container...');
    const createContainerResponse = await containerClient.createIfNotExists();
    if (createContainerResponse.succeeded) {
        console.log('Container created or already exists');
    }
}
ensureContainer().catch(console.error);

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
const port = 80; 
app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});