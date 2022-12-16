import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as acm from 'aws-cdk-lib/aws-certificatemanager';
import { Bucket } from 'aws-cdk-lib/aws-s3';
import { BucketDeployment, Source } from 'aws-cdk-lib/aws-s3-deployment';
import {
    OriginAccessIdentity,
    AllowedMethods,
    ViewerProtocolPolicy,
    OriginProtocolPolicy,
    Distribution,
  } from 'aws-cdk-lib/aws-cloudfront';
import * as origins from "aws-cdk-lib/aws-cloudfront-origins";
import { ARecord, HostedZone, RecordTarget } from "aws-cdk-lib/aws-route53";
import * as route53Targets from "aws-cdk-lib/aws-route53-targets";
import { domainName, hostedZoneName } from './config';

interface CustomStackProps extends cdk.StackProps {
    stage: string;
}

export class CloudfrontStack extends cdk.Stack {
    constructor(scope: Construct, id: string, props?: CustomStackProps) {
      super(scope, id, props);
  
      // Importing ALB domain name
      const loadBalancerDomain = cdk.Fn.importValue("loadBalancerUrl")
      // Get external configuration value from cdk.json
      const cdkJsonConfig = this.node.tryGetContext("stages")[props!.stage]
      
      // SSL certificate 
      const certificateArn = acm.Certificate.fromCertificateArn(this, "tlsCertificate", cdkJsonConfig.certificateArn);

      const websiteBucket = new Bucket(this, "websiteBucket", {
          versioned: false,
          removalPolicy: cdk.RemovalPolicy.DESTROY
      });
      // Trigger frontend deployment
      new BucketDeployment(this, "websiteDeployment", {
          sources: [Source.asset("../cloudfront-alb-cdk/frontend/build/")],
          destinationBucket: websiteBucket as any
      });

      // Create Origin Access Identity for CloudFront
      const originAccessIdentity = new OriginAccessIdentity(this, "cloudfrontOAI", {
        comment: "OAI for web application cloudfront distribution",
      });

      // create Cloudfront distribution
      const cloudFrontDist = new Distribution(this, "cloudfrontDist", {
          defaultRootObject: "index.html",
          domainNames: [domainName],
          certificate: certificateArn,
          defaultBehavior: {
              origin: new origins.S3Origin(websiteBucket as any, {
                  originAccessIdentity: originAccessIdentity as any,
              }) as any,
              compress: true,
              allowedMethods: AllowedMethods.ALLOW_GET_HEAD_OPTIONS,
              viewerProtocolPolicy: ViewerProtocolPolicy.ALLOW_ALL,
          },
          comment: "a cloudfront distribution for both frontend and backend",
      });

      // create custom origin for fargate ALB
      const loadBalancerOrigin = new origins.HttpOrigin(loadBalancerDomain, {
          protocolPolicy: OriginProtocolPolicy.HTTP_ONLY
      });

      // create path pattern to direct to ALB origin
      cloudFrontDist.addBehavior("/generate/*", loadBalancerOrigin as any, {
          compress: true,
          viewerProtocolPolicy: ViewerProtocolPolicy.ALLOW_ALL,
          allowedMethods: AllowedMethods.ALLOW_ALL
      });

      // hostedZone
      const hostedZone = HostedZone.fromLookup(this, 'HostedZone', {
          domainName: hostedZoneName
      });

      // create Arecord alias in Route53
      new ARecord(this, 'ARecord', {
          zone: hostedZone,
          recordName: 'yourPrefix',
          target: RecordTarget.fromAlias(new route53Targets.CloudFrontTarget(cloudFrontDist))
      }) 

      new cdk.CfnOutput(this, "cloudfrontDomainUrl", {
          value: cloudFrontDist.distributionDomainName,
          exportName: "cloudfrontDomainUrl"
      })
    }
  }