# AI PR Summarizer 🤖

An automated DevOps tool that generates structured Pull Request descriptions using Azure Functions and GPT-4o.

🚀 Overview
Automatically populates Azure DevOps PRs with intelligent summaries, saving developer time and improving documentation quality.

🛠 Tech Stack
Runtime: Node.js + Azure Functions (Serverless).

AI: OpenAI GPT-4o API.

DevOps: GitHub Actions (CI/CD) & Azure DevOps API.

⚙️ How it Works
Trigger: A Webhook fires when a PR is created.

Analysis: The function fetches the code diff via Azure DevOps API.

Synthesis: GPT-4o processes the changes and generates a summary.

Update: The function updates the PR description automatically.

📋 PR Template
The AI follows this strict Markdown structure:

Summary: High-level overview.

Changes: Bullet points of technical modifications.

Testing: Detection of new tests in the code.
