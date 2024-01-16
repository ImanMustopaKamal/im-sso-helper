pipeline {
  agent any
  environment {
    APP_ENV = "stag"
    DB_CRED = "dbmanager-stag"
    DB_HOST = "ls-e700a761e961bec9397613f6db73180e76250373.cnqrkeqia8ww.ap-southeast-1.rds.amazonaws.com"
    DB_PORT = "3306"
    DB_NAME = "rmdev"
    DB_CLIENT = "mysql"
    SLACK_URI = "https://hooks.slack.com/services/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"

    DOCKER_IMAGE = "riskobs-db-helper:latest"
    DOCKER_IMAGE_REPO = "riskobs-db-helper"
    DOCKER_REGION = "ap-southeast-1"
    DOCKER_BUILD_URL = "549879428689.dkr.ecr.ap-southeast-1.amazonaws.com"
    DOCKER_BUILD_USERNAME = "AWS"
  }
  stages {
    stage('Preparation') {
      steps {
        echo 'Render config file'
        withCredentials([usernamePassword(credentialsId: "${env.DB_CRED}", usernameVariable: "DB_USER", passwordVariable: "DB_PASSWORD")]) {
          sh "j2 configs/config.template.yaml - -o configs/config.yaml"
        }
      }
    }
    stage('Build Docker Image'){
      steps {
        sh "aws ecr get-login-password --region $DOCKER_REGION | docker login --username $DOCKER_BUILD_USERNAME --password-stdin $DOCKER_BUILD_URL"
        sh "aws ecr describe-repositories --region $DOCKER_REGION --repository-names $DOCKER_IMAGE_REPO || aws ecr create-repository --repository-name $DOCKER_IMAGE_REPO --region $DOCKER_REGION"
        sh "docker build -t $DOCKER_IMAGE ."
        sh "docker tag $DOCKER_IMAGE $DOCKER_BUILD_URL/$DOCKER_IMAGE"
        sh "docker push $DOCKER_BUILD_URL/$DOCKER_IMAGE"
      }
    }
  }
  post { 
    failure { 
      slackSend (color: "#FF0000", message: "Failed: Job '${env.JOB_NAME} [${env.BUILD_NUMBER}]'\n (Build URL: ${env.BUILD_URL})")
    }
  }
}

