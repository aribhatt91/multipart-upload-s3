/* eslint-disable @typescript-eslint/no-explicit-any */
import 'server-only';
import { 
    DynamoDBClient,
    CreateTableCommand, 
    //ListTablesCommand 
 } from '@aws-sdk/client-dynamodb';
import { 
    DynamoDBDocumentClient,
    PutCommand,
    /* GetCommand,
    UpdateCommand,
    DeleteCommand, */
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