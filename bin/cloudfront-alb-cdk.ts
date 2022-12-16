#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { CloudfrontStack } from '../lib/cloudfront';
import { FargateStack } from '../lib/fargate'


const envrionment = { account: "YourAWSAccount", region: "us-west-2"}
const app = new cdk.App();

const FargateDemoStack=new FargateStack(app, "FargateDemoStack", {
  env: envrionment
})

const CloudfrontDemoStack = new CloudfrontStack(app, "CloudfrontDemoStack", {
  stage: "prod",
  env: envrionment
});

CloudfrontDemoStack.addDependency(FargateDemoStack)