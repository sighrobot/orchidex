const AWS = require("aws-sdk");
const S3 = require("aws-sdk/clients/s3");

if (process.env.NODE_ENV === "development") {
  AWS.config.loadFromPath("./aws.json");
} else {
  AWS.config.update(AWS_CONFIG);
}

export const s3 = new S3({
  region: "us-east-1",
});
