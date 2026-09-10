---
title: Urban-Sat
summary: Segments roads and buildings from satellite imagery for urban planning.
role: Design and implementation
stack:
  - U-Net
  - semantic segmentation
  - satellite imagery
date: 2023-06-01
featured: true
order: 3
---

## Problem

Urban planners need road networks and building footprints pulled out of
satellite imagery, which is slow and tedious to trace by hand.

## What I built

A satellite-image segmentation application built on a U-Net model. It segments
roads and building footprints from an input tile and uses those masks to
generate layouts.

## Result

Used to identify road networks from satellite images and to generate house
layouts for urban-planning workflows.
