# Terraform

AWS: VPC → ECR → ECS Fargate behind ALB (origin-verify header) → CloudFront (S3 web + `/api/*`, `/graphql/execute.json/*`) + GitHub OIDC deploy role.

```bash
cd envs/dev
cp backend.hcl.example backend.hcl   # edit bucket
terraform init -backend-config=backend.hcl
terraform apply -var github_repository=owner/repo -var author_token=...
```
Then set GitHub environment vars from outputs: `AWS_REGION`, `AWS_DEPLOY_ROLE_ARN`, `WEB_BUCKET`, `CLOUDFRONT_DISTRIBUTION_ID`.
The GitHub OIDC provider must already exist in the account. CI owns the running ECS task definition revision (`ignore_changes`).
