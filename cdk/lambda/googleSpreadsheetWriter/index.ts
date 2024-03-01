import { SQSEvent, SQSRecord } from "aws-lambda";
import { SecretsManagerClient } from "@aws-sdk/client-secrets-manager";
import { getGoogleApiCredentials } from "./lib/credentialsLoader";
import { insertDataToSheet } from "./lib/googleSpreadsheetWriter";

type MessageBody = {
  sheetId: string;
  sheetName: string;
  data: Record<string, string | number | boolean>;
  headerRowIndex?: number;
};

const secretArn = process.env.SECRET_ARN!;
const secretsManagerClient = new SecretsManagerClient({});

export const handler = async (event: SQSEvent) => {
  for (const record of event.Records) {
    try {
      await handleQueue({ record });
    } catch (e) {
      console.error(e);
    }
  }
};

export const handleQueue = async ({
  record,
}: {
  record: SQSRecord;
}): Promise<any> => {
  const body: MessageBody = JSON.parse(record.body);
  if (!body) throw new Error("Body is required");
  if (!secretArn) throw new Error("secretArn is required");

  console.log({ body });

  const { sheetId, sheetName, headerRowIndex } = body;

  const credentials = await getGoogleApiCredentials({
    secretArn: secretArn,
    secretsManagerClient,
  });

  await insertDataToSheet({
    sheetId,
    sheetName,
    data: body.data,
    credentials,
    headerRowIndex,
  });
};
