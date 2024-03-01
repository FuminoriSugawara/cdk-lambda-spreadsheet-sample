import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as apigatewayv2Integrations from "aws-cdk-lib/aws-apigatewayv2-integrations";
import * as apigatewayv2 from "aws-cdk-lib/aws-apigatewayv2";
import * as sqs from "aws-cdk-lib/aws-sqs";
import * as iam from "aws-cdk-lib/aws-iam";
import * as lambdaEventSources from "aws-cdk-lib/aws-lambda-event-sources";

interface Props extends cdk.StackProps {
  projectName: string;
  secretArn: string;
}

export class LambdaSpreadsheetSampleStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: Props) {
    super(scope, id, props);

    const { projectName, secretArn } = props;

    // SQS queue
    const queue = new sqs.Queue(this, `${projectName}-Queue`, {
      queueName: `${projectName}-Queue`,
      visibilityTimeout: cdk.Duration.seconds(60),
    });

    // Spreadsheet writer

    const googleSpreadsheetWriterLambdaRole = new iam.Role(
      this,
      `${projectName}-GoogleSpreadsheetWriterLambdaRole`,
      {
        assumedBy: new iam.ServicePrincipal("lambda.amazonaws.com"),
        managedPolicies: [
          iam.ManagedPolicy.fromAwsManagedPolicyName(
            "service-role/AWSLambdaBasicExecutionRole",
          ),
        ],
      },
    );

    googleSpreadsheetWriterLambdaRole.addToPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: ["secretsmanager:GetSecretValue"],
        resources: [secretArn],
      }),
    );

    queue.grantConsumeMessages(googleSpreadsheetWriterLambdaRole);

    const googleSpreadsheetWriterLambda = new lambda.Function(
      this,
      `${projectName}-GoogleSpreadsheetWriterLambda`,
      {
        runtime: lambda.Runtime.NODEJS_20_X,
        handler: "index.handler",
        code: lambda.Code.fromAsset("lambda/googleSpreadsheetWriter"),
        role: googleSpreadsheetWriterLambdaRole,
        timeout: cdk.Duration.seconds(60),
        environment: {
          SECRET_ARN: secretArn,
        },
      },
    );

    googleSpreadsheetWriterLambda.addEventSource(
      new lambdaEventSources.SqsEventSource(queue),
    );

    // Handler for Http
    const httpHandlerLambdaRole = new cdk.aws_iam.Role(
      this,
      `${projectName}-HttpHandlerLambdaRole`,
      {
        roleName: `${projectName}-HttpHandlerLambdaRole`,
        assumedBy: new cdk.aws_iam.ServicePrincipal("lambda.amazonaws.com"),
        managedPolicies: [
          cdk.aws_iam.ManagedPolicy.fromAwsManagedPolicyName(
            "service-role/AWSLambdaBasicExecutionRole",
          ),
        ],
      },
    );

    queue.grantSendMessages(httpHandlerLambdaRole);

    const httpHandlerLambda = new lambda.Function(
      this,
      `${projectName}-HttpHandlerLambda`,
      {
        functionName: `${projectName}-HttpHandlerLambda`,
        runtime: lambda.Runtime.NODEJS_20_X,
        handler: "index.handler",
        code: lambda.AssetCode.fromAsset("lambda/httpHandler"),
        role: httpHandlerLambdaRole,
        timeout: cdk.Duration.seconds(60),
        environment: {
          QUEUE_URL: queue.queueUrl,
        },
      },
    );

    // Integrations
    const httpHandlerLambdaIntegration =
      new apigatewayv2Integrations.HttpLambdaIntegration(
        `${projectName}-HttpLambdaIntegration`,
        httpHandlerLambda,
      );

    // Http API

    const httpApi = new apigatewayv2.HttpApi(this, `${projectName}-HttpApi`, {
      apiName: `${projectName}-HttpApi`,
      corsPreflight: {
        allowOrigins: ["*"],
        allowMethods: [apigatewayv2.CorsHttpMethod.ANY],
      },
      createDefaultStage: true,
    });

    httpApi.addRoutes({
      path: "/{proxy+}",
      methods: [apigatewayv2.HttpMethod.ANY],
      integration: httpHandlerLambdaIntegration,
    });

    new cdk.CfnOutput(this, "HttpApiUrl", {
      value: httpApi.url ?? "Something went wrong with the deployment",
    });
  }
}
