import * as cdk from "aws-cdk-lib";
import { Construct } from 'constructs';
import { Vpc, SubnetType, IpAddresses } from "aws-cdk-lib/aws-ec2";
import * as ecs from "aws-cdk-lib/aws-ecs";
import * as ecs_patterns from "aws-cdk-lib/aws-ecs-patterns";

export class FargateStack extends cdk.Stack {
    constructor(scope: Construct, id: string, props?: cdk.StackProps) {
        super(scope, id, props);

        // vpc
        const newVpc = new Vpc(this, "cloudfrontFargateVpc", {
            ipAddresses: IpAddresses.cidr('172.64.0.0/16'),
            natGateways: 1,
            maxAzs: 3,
            subnetConfiguration: [
                {
                    name: 'private-subnet-1',
                    subnetType: SubnetType.PRIVATE_WITH_EGRESS,
                    cidrMask: 24
                },
                {
                    name: 'public-subnet-1',
                    subnetType: SubnetType.PUBLIC,
                    cidrMask: 24
                },
                {
                    name: 'isolated-subnet-1',
                    subnetType: SubnetType.PRIVATE_ISOLATED,
                    cidrMask: 24
                }
            ]
        });
        // ECS cluster
        const ecsCluster = new ecs.Cluster(this, "demoFargateCluster", {
            vpc: newVpc as any,
        });

        // Fargate service
        const backendService = new ecs_patterns.ApplicationLoadBalancedFargateService(this, "backendService", {
            cluster: ecsCluster,
            memoryLimitMiB: 1024,
            cpu: 512,
            desiredCount: 2,
            taskImageOptions: {
                image: ecs.ContainerImage.fromAsset("../cloudfront-alb-cdk/backend/"),
                environment: {
                    myVar: "variable01"
                }
            }
        });
        // health check
        backendService.targetGroup.configureHealthCheck({ path: "/health" });

        // ALB url
        new cdk.CfnOutput(this, "loadBalancerUrl", {
            value: backendService.loadBalancer.loadBalancerDnsName,
            exportName: "loadBalancerUrl"
        });
    }
}