#!/bin/bash

echo "Creating S3 bucket for local development..."

aws --endpoint-url=http://localhost:4566 s3 mb s3://dev-local || true

echo "Done!"