const express = require('express');
const { BlobServiceClient } = require('@azure/storage-blob');
const app = express();

app.use(express.json());
app.use(express.static(__dirname));

// Configuration (replace with your connection string)
const connectionString = 'DefaultEndpointsProtocol=https;AccountName=revvsafetynew2;AccountKey=NWiK/ZENL+HZaFz1E6JEGnD/CIBPRHLvuakzLjaIBnTuCe1qZ1rZfwi8rmuMaqyEl/4BbXFTYtUY+AStPN39+w==;EndpointSuffix=core.windows.net'; // Paste your storage account connection string here
const containerName = 'reports';
const blobServiceClient = BlobServiceClient.fromConnectionString(connectionString);
const containerClient = blobServiceClient.getContainerClient(containerName);

// Ensure container exists
async function ensureContainer() {
    const createContainerResponse = await containerClient.createIfNotExists();
    if (createContainerResponse.succeeded) {
        console.log('Container created or already exists');
    }
}
ensureContainer();

// Save report
app.post('/save-report', async (req, res) => {
    console.log('Received POST /save-report:', req.body); // Debug log
    const report = req.body;
    const blobName = `${Date.now()}-${report.site}.json`;
    const blockBlobClient = containerClient.getBlockBlobClient(blobName);
    try {
        await blockBlobClient.uploadData(JSON.stringify(report, null, 2), {
            blobHTTPHeaders: { blobContentType: 'application/json' }
        });
        res.send('Report saved successfully!');
    } catch (error) {
        console.error('Error saving report:', error);
        res.status(500).send('Error saving report: ' + error.message);
    }
});

// Serve the form
app.get('/', (req, res) => {
    res.sendFile(__dirname + '/index.html');
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});