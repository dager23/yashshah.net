---
title: VideoGPT
summary: Turns a long video into a short summary with follow-up Q&A.
role: Design and implementation
stack:
  - speech-to-text
  - LLMs
  - NLP
  - multilingual
date: 2023-08-01
featured: false
order: 4
---

## Problem

Long videos are slow to search, and a raw transcript is still too long to skim
when you only need the gist.

## What I built

An automated pipeline that transcribes a YouTube video with speech-to-text and
then uses an LLM to produce a concise summary. It also answers follow-up
questions over the transcript and can return summaries in multiple languages.
