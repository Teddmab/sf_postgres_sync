// Importing the necessary modules
const { Client } = require('pg');
const jsforce = require('jsforce');
require('dotenv').config();

const salesforceConfig = {
    instanceUrl : process.env.SF_INSTANCE_URL,
    accessToken : process.env.SF_ACCESS_TOKEN
};


// Your PostgreSQL connection parameters
const postgresConfig = {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
};

async function fetchDataFromPostgres() {
    const client = new Client(postgresConfig);

    await client.connect();

    // This query fetches all rows from your table. 
    // Adjust this according to your needs.
    const query = 'SELECT * FROM conf.accounts';

    const res = await client.query(query);

    await client.end();

    return res.rows;
}

async function sendDataToSalesforce(data) {
    const conn = new jsforce.Connection(salesforceConfig);
    
    for (let row of data) {
        const sfObject = {
            code__c: row.code,
            id__c: row.id,
            title__c: row.title,
            salesforce_id__c: row.salesforce_id,
            tag_ids__c: row.tag_ids.join(',') // Convert array of tags into a comma-separated string
        };
        
        // Insert or update the object in Salesforce
        // Use 'db_account__c' as your Custom Object API name
        const result = await conn.sobject('db_account__c').upsert(sfObject, 'id__c'); 
        
        console.log('Upserted Salesforce object', result);
    }
}

// This function will contain the logic for our application
async function run() {
    const data = await fetchDataFromPostgres();
    console.log('Fetched data from PostgreSQL', data);
    
    await sendDataToSalesforce(data);
    console.log('Sent data to Salesforce');
}

// Call our main function
run().catch(console.error);
