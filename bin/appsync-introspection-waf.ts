#!/usr/bin/env node
import "source-map-support/register";
import * as cdk from "aws-cdk-lib";
import { AppsyncIntrospectionWafStack } from "../lib/appsync-introspection-waf-stack";

const app = new cdk.App();
new AppsyncIntrospectionWafStack(app, "AppsyncIntrospectionWafStack", {});
