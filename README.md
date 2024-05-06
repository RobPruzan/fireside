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

Effective communication is key to the success of both teaching and learning. Fireside bridges the gap between traditional teaching methods and modern technological solutions, enabling teachers to connect with their peers and students, and engage with students more effectively.

## Features

- **Live Messaging and Reactions**: Engage participants with live messaging and instant reactions. This feature allows users to express thoughts and feedback dynamically, promoting an interactive and responsive learning environment.
- **Multi-User Whiteboard**: Engage in collaborative learning with a fully interactive whiteboard. This feature allows multiple participants to draw, write, and visually share ideas and show their knowledge on a topic in real-time during discussions and virtual classes. It's perfect for brainstorming sessions, solving problems collectively, or illustrating concepts dynamically.
- **Professor-Only Whiteboard**: For lectures or presentations where only the educator should have control, the professor-only whiteboard mode ensures that the teacher can present materials without interference. This mode allows professors to illustrate lessons while maintaining the focus of the class, making it easier to guide students through complex subjects.
- **Intelligent Question Answering with LLMs**: Leverage cutting-edge language models like Open-Mixtral-8x7b to automatically answer student questions. This system intelligently identifies relevant sections of live transcripts and provides answers directly in the discussion thread, enhancing educational interactions and support.
- **Live Audio Streaming**: Utilize WebRTC for real-time audio streaming to an unlimited number of users, ensuring seamless communication in lectures, announcements, or collaborative sessions. The audio streaming will only take in the camp owner's input device to avoid any disruptive participators.
- **Live Transcription**: Enhance accessibility and engagement with real-time transcription powered by a distilled version of OpenAI whisper; the model runs locally on the browser through the onnx runtime (wasm/webgpu). This feature provides real time transcription of live audio, making content accessible to all participants.
- **Polling**: Allow the owner to start a poll and get input based on the poll's objective. Polls can also be used as a quiz substitute so if a professor is using our platform, there can be an all-in-one location for class-related topics.

## Run the website locally

`docker-compose up`

## Usage

To use Fireside, simply sign up for an account and start exploring the available features. Here are some key actions you can take:

- Create a Channel: Organize discussions and resources by creating camps for specific subjects, classes, or topics and having your friends, collaborators, or anyone to the camp.

- Engage in Live Discussions: Join any camp and start interacting with the other users by sending live messages and reactions to other messages sent.

- Collaborate on a Whiteboard: Join a camp and create a new whiteboard instance and use the collaborative real-time whiteboard for visual teaching, problem-solving, or brainstorming. This tool supports multiple users and media uploads.

  - When sending a message notice the white board button icon to the right of the textarea
  - After clicking the button, you will see a whiteboard on your screen, draw or upload whatever you want on this. You are able to pan and there is no limit to the amount of content
  - When done, click "Attach"
  - Send a question alongside the whiteboard
  - When sent you will see a whiteboard appear in the chat. Anyone can see this and augment the whiteboard. You can see their mouse cursors and usernames in real time

- LLM Q&A: Post your questions in a camp and get answers on-the-fly (requires valid MISTRAL_API_KEY in services/backend/.env)

  - Send any message in any camp
  - View the thread by clicking the message icon on the message
  - An attempted answer will show up in the thread, created by our LLM (named Corbin)
    - The LLM will be fed the transcript of the camp. If there is context for the question in the transcript the LLM will also respond with the context it identified

- Real-time audio and transcription:

  - After creating a camp expand the toolbar at the top of the page
  - Notice the megaphone button icon, clicking this will start an audio broadcast and will download the whisper model to your browser. This feature is only officially supported on desktop through chrome/safari.
  - Once the megaphone is green you can start talking. Other participants can join the broadcast by clicking the audio-wave button icon in their toolbar (not camp creators can only listen, not broadcast their audio), this will be in the same place the megaphone button icon was for the camp creator
  - After the model is done downloading (indicated by the progress indicator) your audio will be live transcribed. Notice the button icon in the toolbar that looks like a [transcript](https://cdn.discordapp.com/attachments/823746473199271946/1236754515290755092/image.png?ex=663928e6&is=6637d766&hm=5ea0610050dc0d622dcc839f6e536dbdb96f9ce67dd4143ee8ed2090e48f743e&). Click this to view the most recent live transcript (viewable to all participants in camp)
  - To end the audio broadcast click the green megaphone

- Instructor created polls: Send polls to users in camp in real time
  - After you create a camp notice a ["Create Poll"](https://cdn.discordapp.com/attachments/823746473199271946/1236755339739926661/image.png?ex=663929aa&is=6637d82a&hm=30aaa505feb2f44fa09370ad5539ec93b2d3ca719881b28771fbafa35b460098&) button in the top left of the messaging section
  - Enter the desired question/answers
  - Enter the scheduled date and time you want the poll to show up for users
  - After created, the poll will show up to all users in the camp (server initiated) when the date/time conditions are met
  - The creator of the camp can view the responses in real time
