# ResumeVC

## Project Overview:

The goal of this project is to create a web application that lets users track resume revisions and organize resumes by type so that they can easily grab the best-suited resume for any given job. 

The intended audience is any job seeker that uses a resume when applying for jobs (basically almost everyone.) The motivation for creating this project is that job seeking often requires fitting your resume to job requirements, which results in either many unorganized resume variations or lost revision history. This application would allow job seekers to apply to jobs more quickly and effectively, ensuring that each resume is tailored to the application, every single time.

### Team Members:

* Omer Karimi
* Cameron Proulx
* Usman Khan
* Aryan Pothanaboyina

## How to Setup
1. Ensure you have [uv](https://docs.astral.sh/uv/getting-started/installation/) and [bun](https://bun.sh/) installed.
2. Ensure you have the `client/.env` and `server/.env` files set up.
3. In the root project directory, run `bun i` then `bun dev`.
4. Visit the Vite server (http://localhost:5173).
5. To run the Playwright tests, ensure the dev server isn't running and run `bun run test`.

The Vite server is preferable as it shows automatic updates in client and server code. The Flask server (http://127.0.0.1:5000) only does so for server code and requires the client to be built beforehand with `bun run client:build`. See the root `package.json` for other scripts.