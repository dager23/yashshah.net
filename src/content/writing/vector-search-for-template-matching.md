---
title: Template matching without the pixel-by-pixel scan
description: Notes on swapping brute-force template comparison for nearest-neighbour search over feature-map embeddings.
pubDate: 2025-01-01
draft: true
---

A working outline. Not published yet.

- Why pixel-level template comparison stops scaling once the template set is large
- Encoding templates as feature-map embeddings
- Nearest-neighbour lookup in a vector database
- What you give up: the upfront embedding pass, index maintenance
- When brute force is still the right call
