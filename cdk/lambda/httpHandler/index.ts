import { APIGatewayProxyEventV2 } from "aws-lambda";
import { SendMessageCommand, SQSClient } from "@aws-sdk/client-sqs";

const sqsClient = new SQSClient({});

export const handler = async (event: APIGatewayProxyEventV2): Promise<any> => {
  const queueUrl = process.env.QUEUE_URL!;
  // POST
  if (event.requestContext.http.method === "POST") {
    return await postHandler({ event, queueUrl });
  }

  return {
    statusCode: 200,
    body: JSON.stringify({ message: "Hello, World!" }),
  };
};

const postHandler = async ({
  event,
  queueUrl,
}: {
  event: APIGatewayProxyEventV2;
  queueUrl: string;
}) => {
  console.log(JSON.stringify(event, null, 2));

  const body = JSON.parse(event.body!);

  try {
    await sendQueue({
      data: body,
      queueUrl,
    });
  } catch (e) {
    console.error(e);
  }

  return {
    statusCode: 200,
    body: JSON.stringify({ message: "success" }),
  };
};

export const sendQueue = async ({
  data,
  queueUrl,
}: {
  data: Record<string, string | number | boolean>;
  queueUrl: string;
}) => {
  const params = {
    MessageBody: JSON.stringify(data),
    QueueUrl: queueUrl,
  };
  try {
    await sqsClient.send(new SendMessageCommand(params));
  } catch (e) {
    console.error(e);
  }
};
