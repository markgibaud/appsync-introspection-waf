import * as cdk from "aws-cdk-lib";
import { CfnOutput } from "aws-cdk-lib";
import * as appsync from "aws-cdk-lib/aws-appsync";
import * as waf from "aws-cdk-lib/aws-wafv2";
import { CfnWebACLAssociation } from "aws-cdk-lib/aws-wafv2";
import { Construct } from "constructs";

import * as path from "path";
export class AppsyncIntrospectionWafStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const api = new appsync.GraphqlApi(this, "Api", {
      name: "UnintrospectableAppSyncApi",
      schema: appsync.SchemaFile.fromAsset(
        path.join(__dirname, "schema.graphql")
      ),
      authorizationConfig: {
        defaultAuthorization: {
          authorizationType: appsync.AuthorizationType.API_KEY,
        },
      },
    });

    new CfnOutput(this, "GraphQLAPIURL", {
      value: api.graphqlUrl,
    });

    const firewall = new waf.CfnWebACL(this, "waf-firewall", {
      defaultAction: {
        allow: {},
      },
      description: "Block GraphQL introspection queries",
      scope: "REGIONAL",
      visibilityConfig: {
        cloudWatchMetricsEnabled: true,
        metricName: "BlockIntrospectionMetric",
        sampledRequestsEnabled: true,
      },
      rules: [
        {
          name: "BlockIntrospectionQueries",
          priority: 0,
          action: {
            block: {},
          },
          visibilityConfig: {
            sampledRequestsEnabled: true,
            cloudWatchMetricsEnabled: true,
            metricName: "BlockedIntrospection",
          },
          statement: {
            byteMatchStatement: {
              fieldToMatch: {
                body: {},
              },
              positionalConstraint: "CONTAINS",
              searchString: "__schema",
              textTransformations: [
                {
                  type: "LOWERCASE",
                  priority: 0,
                },
              ],
            },
          },
        },
      ],
    });

    new CfnWebACLAssociation(this, "web-acl-association", {
      webAclArn: firewall.attrArn,
      resourceArn: api.arn,
    });
  }
}
