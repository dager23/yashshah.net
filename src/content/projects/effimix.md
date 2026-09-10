---
title: Effimix
summary: A feature-fusion CNN for gastrointestinal disease classification, published in Diagnostics.
role: Co-author, model architecture and evaluation
stack:
  - EfficientNet-B0
  - squeeze-and-excitation
  - feature fusion
  - HyperKvasir dataset
date: 2022-10-01
featured: true
order: 2
---

## Problem

Classifying gastrointestinal diseases from endoscopy images is hard: the
differences between conditions are subtle and labelled data is limited, so a
single backbone tends to either overfit or miss disease-specific structure.

## What I built

Effimix, a CNN that fuses features from a pretrained EfficientNet-B0 with a
purpose-built branch using squeeze-and-excitation blocks and self-normalising
activations. It was evaluated on the HyperKvasir endoscopy dataset.

## Key decision or trade-off

Feature fusion rather than fine-tuning one network. Combining a pretrained
backbone with a custom branch lets the model keep general visual features while
still learning what is specific to endoscopy images.

## Result

The method surpassed prior benchmarks on the task and was published in
_Diagnostics_ (MDPI), 2022, volume 12, article 2316.
