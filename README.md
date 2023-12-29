# Divinto

Divinto is a website that encourages users to delve into their thoughts by documenting daily reflections. It offers wide whiteboard for insightful connections between their entries and provides AI-powered personalized advice to enhance self-awareness and understanding.

**Currently provide a mock data set for feature tests after user registration**

<hr>

## Features demo:

1. whiteboard features

<img src ="https://d3dw5mf8d1p6ix.cloudfront.net/whiteboard-feature.gif">

<hr>

2. search features

<img src ="https://d3dw5mf8d1p6ix.cloudfront.net/search-feature.gif">

<hr>

3. AI-powered personalized advice

<img src ="https://d3dw5mf8d1p6ix.cloudfront.net/agent-feature.gif">

<hr>

## Skills

- TypeScript, Express, Bun
- MongoDB, redis
- React, React-flow
- AWS Lambda, SQS, EventBridge
- AWS EC2, S3, CloudFront
- Open AI assistant API
- Bun unit test, integration test
- K6 load test
- GitHub Actions CI/CD

## System Architecture Diagram

- The project is based-on MVC structure, using TypeScript Express framework for back-end, React for front-end and MongoDB as NoSQL database solution.
- deployed a serverless system to enhance data preservation with less burden of main server.

<img src ="https://d3dw5mf8d1p6ix.cloudfront.net/658cf7e3e4f7aed6cde133e3/658d3796e4f7aed6cde1369c/project-structure.png" >

## Project Develop Details

#### 1. Enhanced development efficiency and speed by Bun :

> Accelerated performance and development efficiency by implementing Bun as the TypeScript runtime, leveraging its test and package manager features, integrating with GitHub Actions to streamline the distribution process.

#### 2. Data storage and full-text search:

> Utilized MongoDB Atlas for reliable data storage, effectively handling large volumes of text data. Additionally, employed Atlas Search for full-text search feature which offering a much lighter solution than Elasticsearch.

#### 3. Serverless data-backup system:

> Implemented a serverless architecture to facilitate database backups, enhancing data persistence while preventing additional load on the main server and handling potential high-volume MongoDB requests using Amazon SQS.

#### 4. Personalized AI advices:

> Integrated the user data and OpenAI Assistant API to provide personalized advice functionality at a minimal cost.

#### 5. Cache and Speed Optimization:

> Deployed static files to AWS S3 with CloudFront as a CDN and utilizing Redis for database cache, which resulting in a 50% improvement in API response time and a 56% increase in Request Per Second (RPS) with 400 virtual users over 5 minutes, verified through k6 load testing.

##### load test comparsion tables

- without redis
  | VUs | total request | rps | request_duration | success rate | data_recieved |
  |---|---|---|---|---|---|
  | 200 | 38759 | 128 | 544 ms | 100% | 594 MB |
  | 300 | 44650 | 148 | 1\.01s | 100% | 685 MB |
  | 400 | 44799 | 148 | 1\.67s | 100% | 688MB |

- with redis as cache
  | VUs | total request | rps | request_duration | success rate | data_recieved |
  |---|---|---|---|---|---|
  | 200 | 42576 | 141 | 406 ms | 100% | 685 MB |
  | 300 | 61541 | 203 | 457 ms | 100% | 990 MB |
  | 400 | 70270 | 232 | 702 ms | 100% | 1\.1 GB |
