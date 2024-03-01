#!/usr/bin/env node
import "source-map-support/register";
import * as cdk from "aws-cdk-lib";
import { LambdaSpreadsheetSampleStack } from "../lib/lambdaSpreadsheetSampleStack";

const app = new cdk.App();
new LambdaSpreadsheetSampleStack(app, "LambdaSpreadsheetSampleStack", {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION,
  },
  projectName: "LambdaSpreadsheetSample",
  secretArn: process.env.SECRET_ARN!,
});
