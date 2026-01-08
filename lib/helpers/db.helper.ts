/* eslint-disable @typescript-eslint/no-explicit-any */
import 'server-only';
import { 
    DynamoDBClient,
    CreateTableCommand,
    //ListTablesCommand 
 } from '@aws-sdk/client-dynamodb';
import { 
    DeleteCommand,
    DynamoDBDocumentClient,
    PutCommand,
    QueryCommand,
    /* GetCommand,
    UpdateCommand,*/
    ScanCommand
 } from '@aws-sdk/lib-dynamodb';
import Logger from '@/lib/logger';
import { DB_CONFIG } from '../config';

const REGION = DB_CONFIG.region || 'us-east-1';

const client = new DynamoDBClient({
  region: REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || "",
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || ""
  }
});
const docClient = DynamoDBDocumentClient.from(client);

/**
 * Create (insert/replace) an item
 * @param {string} tableName - Table name
 * @param {object} item - Full item to insert
 */
export const saveDocument = async (tableName: string, item: any) => {
  return new Promise(async (resolve, reject) => {
    try {
      const cmd = new PutCommand({ TableName: tableName, Item: item });
      const res = await docClient.send(cmd);
      Logger.log(`Item created in table ${tableName}:`, item);
      resolve(res); // Return the response from DynamoDB
    } catch (error) {
      Logger.error(`Error creating item in table ${tableName}:`, error);
      reject(error);
    }
  });
};

/**
 * Get all items from a DynamoDB table.
 * @param {string} tableName - The DynamoDB table name.
 * @param {object} [options] - Optional parameters.
 * @param {string[]} [options.attributes] - Specific attributes to return.
 * @param {string} [options.filterExpression] - Filter expression (optional).
 * @param {object} [options.expressionValues] - Expression attribute values for the filter.
 * @returns {Promise<object[]>} - All items in the table.
 */
export async function getAllDocuments(tableName: string, options: any = {}) {
  let items: any[] = [];
  let lastEvaluatedKey = undefined;

  do {
    const params: any = {
      TableName: tableName,
      ExclusiveStartKey: lastEvaluatedKey,
    };

    if (options?.attributes) {
      params.ProjectionExpression = options.attributes.join(", ");
    }

    if (options?.filterExpression) {
      params.FilterExpression = options.filterExpression;
      params.ExpressionAttributeValues = options.expressionValues;
    }

    const command = new ScanCommand(params);
    const response = await docClient.send(command);

    if (response.Items) {
      items = items.concat(response.Items);
    }
    lastEvaluatedKey = response.LastEvaluatedKey;
  } while (lastEvaluatedKey);

  return items;
}

/**
 * Deletes a file record by its fileName using a GSI.
 * @param tableName - The DynamoDB table name.
 * @param fileName - The specific filename attribute to search for.
 */
export async function deleteDocumentsByFileName(tableName: string, fileName: string): Promise<void> {
  try {
    // 1. Find the item ID using the fileName index
    // Note: 'fileName-index' must be created in your AWS Console first
    const findCommand = new QueryCommand({
      TableName: tableName,
      IndexName: "fileName-index", 
      KeyConditionExpression: "fileName = :fn",
      ExpressionAttributeValues: {
        ":fn": fileName,
      },
    });

    const { Items } = await docClient.send(findCommand);

    if (!Items || Items.length === 0) {
      console.warn(`No record found with fileName: ${fileName}`);
      return;
    }

    // 2. Iterate and delete found records by their Primary Key (id)
    // Production note: If many files share one name, use Promise.all or BatchWrite
    for (const item of Items) {
      const deleteCommand = new DeleteCommand({
        TableName: tableName,
        Key: {
          id: item.id, // Primary Key lookup
        },
      });

      await docClient.send(deleteCommand);
      console.log(`Successfully deleted record ID: ${item.id} (File: ${fileName})`);
    }

  } catch (error) {
    console.error("DYNAMODB_ATTRIBUTE_DELETE_ERROR:", error);
    throw new Error(`Failed to delete record with fileName: ${fileName}`);
  }
}

/**
 * Deletes a file record from DynamoDB.
 * @param tableName - The DynamoDB table name.
 * @param fileId - The Primary Key (Hash Key) of the record.
 */
export async function deleteDocumentById(tableName: string, uploadId: string): Promise<void> {
  try {
    const command = new DeleteCommand({
      TableName: tableName,
      Key: {
        uploadId, // Ensure this matches your Table Schema Primary Key
      },
    });

    await docClient.send(command);
    console.log(`DynamoDB: successfully deleted record ${uploadId}`);
  } catch (error) {
    console.error("DYNAMODB_DELETE_ERROR:", error);
    throw new Error(`Failed to delete record from DB: ${uploadId}`);
  }
}