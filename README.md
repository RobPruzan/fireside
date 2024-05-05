# Fireside

Fireside is a communication platform designed specifically for educators to facilitate collaboration, communication, and resource sharing among teachers and students.

## Table of Contents

- [Introduction](#introduction)
- [Features](#features)
- [Dependencies](#dependencies)
- [Installation](#installation)
- [Usage](#usage)

## Introduction

Fireside provides a secure and intuitive environment for teachers to connect with their students. With features tailored to the needs of educators, Fireside streamlines communication, simplifies resource sharing, and fosters collaboration within educational communities.

In today's fast-paced educational environments, effective communication is key to the success of both teaching and learning. Fireside bridges the gap between traditional teaching methods and modern technological solutions, enabling teachers to connect with their peers and students, and engage with students more effectively.

## Features

- **Live Messaging and Reactions**: Engage participants with live messaging and instant reactions. This feature allows users to express thoughts and feedback dynamically, promoting an interactive and responsive learning environment.
- **Multi-User Whiteboard**: Engage in collaborative learning with a fully interactive whiteboard. This feature allows multiple participants to draw, write, and visually share ideas and show their knowledge on a topic in real-time during discussions and virtual classes. It's perfect for brainstorming sessions, solving problems collectively, or illustrating concepts dynamically.
- **Professor-Only Whiteboard**: For lectures or presentations where only the educator should have control, the professor-only whiteboard mode ensures that the teacher can present materials without interference. This mode allows professors to illustrate lessons while maintaining the focus of the class, making it easier to guide students through complex subjects.
- **Intelligent Question Answering with LLMs**: Leverage cutting-edge language models like Open-Mixtral-8x7b to automatically answer student questions. This system intelligently identifies relevant sections of live transcripts and provides answers directly in the discussion thread, enhancing educational interactions and support.
- **Live Audio Streaming**: Utilize WebRTC for real-time audio streaming to an unlimited number of users, ensuring seamless communication in lectures, announcements, or collaborative sessions. The audio streaming will only take in the camp owner's input device to avoid any disruptive participators.
- **Live Transcription**: Enhance accessibility and engagement with real-time transcription powered by a WebAssembly (WASM) version of the distilled Whisper model. This feature provides instant transcription of live audio, making content accessible to all participants.
- **Polling**: Allow the owner to start a poll and get input based on the poll's objective. Polls can also be used as a quiz substitute so if a professor is using our platform, there can be an all-in-one location for class-related topics.

## Dependencies

- npm (to install pnpm) https://docs.npmjs.com/downloading-and-installing-node-js-and-npm
- pnpm (package manager) `npm install -g pnpm`
- bun (runtime for backend service) https://bun.sh/docs/installation
- docker https://www.docker.com/get-started/

## Installation

To install Fireside, follow these steps:

1. Clone the repository from GitHub: `git clone https://github.com/RobPruzan/fireside.git`
2. Navigate to the project directory: `cd Fireside`
3. Install dependencies: `pnpm install`



## Setting up the database

docker-compose -f docker-compose.dev.yaml up db --build

cd services/db

pnpm migrate:generate && pnpm migrate:run && pnpm seed:emoji

## Setting up the Backend
docker-compose -f docker-compose.dev.yaml up --build --force-recreate

## Setting up the Frontend
services/frontend

pnpm run dev

## Usage
To use Fireside, simply sign up for an account and start exploring the available features. Here are some key actions you can take:

- Create a Channel: Organize discussions and resources by creating camps for specific subjects, classes, or topics and having your friends, collaborators, or anyone to the camp.

- Engage in Live Discussions: Join any camp and start interacting with the other users by sending live messages and reactions to other messages sent. 

- Collaborate on a Whiteboard: Join a camp and create a new whiteboard instance and use the collaborative real-time whiteboard for visual teaching, problem-solving, or brainstorming. This tool supports multiple users and media uploads. 

- LLM Q&A: Post your questions during a live session and get answers on-the-fly. We use a LLM that will use the audio transcription to answer questions. 

- Real-time audio and transcription: Activate live transcription during any audio stream via the owner of the camp. This is facilitated by our WASM implementation of the distilled Whisper model, which provides accurate, real-time transcriptions, making content more accessible and easier to follow.

- Polling feature: Allow the owner to start a poll and get input based on the poll’s objective. Polls can also be used as a quiz substitute so if a professor is using our platform there can be an all in one location for class related topics. 