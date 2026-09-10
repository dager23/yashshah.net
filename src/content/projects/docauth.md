---
title: DocAuth
summary: Detects and localises document forgeries at 97% accuracy.
role: Design and implementation.
stack:
  - metadata analysis
  - Fourier analysis
  - Error Level Analysis
  - template matching
  - vector database
date: 2023-12-01
featured: true
order: 1
---

## Problem

Photoshop edits, splices and copy-move forgeries in scanned documents are hard to
catch by eye, and manual verification does not scale when a team has to check
authenticity across many documents.

## What I built

A document-analysis system that combines four signals — metadata analysis,
Fourier-domain inspection, Error Level Analysis and template matching — to decide
whether a document has been altered and to highlight where. Reference templates
are encoded as vectored feature-maps and stored in a vector database, so matching
a new document against a large template set is a nearest-neighbour lookup rather
than a pixel-by-pixel scan.

## Key decision or trade-off

Matching on vectored feature-maps in a vector database, instead of direct
pixel-level template comparison. It keeps lookup fast as the template set grows,
at the cost of an upfront step to embed every template.

## Result

Detects and highlights manipulations with 97% accuracy. The project won first
place at Smart India Hackathon 2023.
