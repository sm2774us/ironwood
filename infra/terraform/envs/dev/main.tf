terraform {
  required_version = ">= 1.10"
  required_providers {
    aws    = { source = "hashicorp/aws", version = "~> 5.0" }
    random = { source = "hashicorp/random", version = "~> 3.6" }
  }
  backend "s3" {
    # bucket / region supplied via: terraform init -backend-config=backend.hcl
    key          = "ironwood/dev/terraform.tfstate"
    encrypt      = true
    use_lockfile = true
  }
}

provider "aws" {
  region = var.region
  default_tags {
    tags = { Project = "ironwood", Environment = "dev", ManagedBy = "terraform" }
  }
}

variable "region" {
  type    = string
  default = "us-east-1"
}
variable "github_repository" {
  type        = string
  description = "owner/repo allowed to assume the deploy role via OIDC"
}
variable "author_token" {
  type      = string
  sensitive = true
}
variable "bootstrap_image" {
  type    = string
  default = "public.ecr.aws/docker/library/node:22-alpine"
}

locals { name = "ironwood-dev" }

module "network" {
  source   = "../../modules/network"
  name     = local.name
  az_count = 2
}

module "ecr" {
  source = "../../modules/ecr"
  name   = "${local.name}-api"
}

module "api" {
  source             = "../../modules/api_service"
  name               = local.name
  vpc_id             = module.network.vpc_id
  public_subnet_ids  = module.network.public_subnet_ids
  private_subnet_ids = module.network.private_subnet_ids
  image              = var.bootstrap_image
  author_token       = var.author_token
  min_tasks          = 1
  max_tasks          = 3
  cpu                = 256
  memory             = 512
}

module "web" {
  source              = "../../modules/web_cdn"
  name                = local.name
  alb_dns_name        = module.api.alb_dns_name
  origin_verify_value = module.api.origin_verify_value
}

# ── GitHub Actions OIDC deploy role (no long-lived keys) ──
data "aws_iam_openid_connect_provider" "github" {
  url = "https://token.actions.githubusercontent.com"
}

data "aws_iam_policy_document" "deploy_assume" {
  statement {
    actions = ["sts:AssumeRoleWithWebIdentity"]
    principals {
      type        = "Federated"
      identifiers = [data.aws_iam_openid_connect_provider.github.arn]
    }
    condition {
      test     = "StringEquals"
      variable = "token.actions.githubusercontent.com:aud"
      values   = ["sts.amazonaws.com"]
    }
    condition {
      test     = "StringLike"
      variable = "token.actions.githubusercontent.com:sub"
      values   = ["repo:${var.github_repository}:environment:dev"]
    }
  }
}

resource "aws_iam_role" "deploy" {
  name               = "${local.name}-github-deploy"
  assume_role_policy = data.aws_iam_policy_document.deploy_assume.json
}

data "aws_iam_policy_document" "deploy" {
  statement {
    actions   = ["ecr:GetAuthorizationToken"]
    resources = ["*"]
  }
  statement {
    actions   = ["ecr:BatchCheckLayerAvailability", "ecr:InitiateLayerUpload", "ecr:UploadLayerPart", "ecr:CompleteLayerUpload", "ecr:PutImage", "ecr:BatchGetImage"]
    resources = [module.ecr.repository_arn]
  }
  # Describe/Register task-definition APIs do not support resource-level permissions.
  statement {
    actions   = ["ecs:DescribeTaskDefinition", "ecs:RegisterTaskDefinition"]
    resources = ["*"] #tfsec:ignore:aws-iam-no-policy-wildcards
  }
  statement {
    actions   = ["ecs:DescribeServices", "ecs:UpdateService"]
    resources = [module.api.service_arn]
  }
  statement {
    actions   = ["iam:PassRole"]
    resources = [module.api.execution_role_arn, module.api.task_role_arn]
  }
  statement {
    actions   = ["s3:ListBucket"]
    resources = [module.web.bucket_arn]
  }
  statement {
    actions   = ["s3:GetObject", "s3:PutObject", "s3:DeleteObject"]
    resources = ["${module.web.bucket_arn}/*"] #tfsec:ignore:aws-iam-no-policy-wildcards
  }
  statement {
    actions   = ["cloudfront:CreateInvalidation"]
    resources = [module.web.distribution_arn]
  }
}

resource "aws_iam_role_policy" "deploy" {
  role   = aws_iam_role.deploy.id
  policy = data.aws_iam_policy_document.deploy.json
}

output "site_url" { value = "https://${module.web.domain_name}" }
output "deploy_role_arn" { value = aws_iam_role.deploy.arn }
output "web_bucket" { value = module.web.bucket_name }
output "cloudfront_distribution_id" { value = module.web.distribution_id }
output "ecr_repository_url" { value = module.ecr.repository_url }
