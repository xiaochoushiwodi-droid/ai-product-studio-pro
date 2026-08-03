"use client";

import type { SavedProject } from "@/types/product";

const PROJECTS_KEY = "togo-ai.projects";
const LEGACY_PROJECTS_KEY = ["ai", "product", "studio", "pro.projects"].join("-");

export function loadSavedProjects(): SavedProject[] {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const value = window.localStorage.getItem(PROJECTS_KEY) ?? window.localStorage.getItem(LEGACY_PROJECTS_KEY);
    if (value && !window.localStorage.getItem(PROJECTS_KEY)) {
      window.localStorage.setItem(PROJECTS_KEY, value);
    }
    return value ? (JSON.parse(value) as SavedProject[]) : [];
  } catch {
    return [];
  }
}

export function saveProject(project: SavedProject) {
  const projects = loadSavedProjects();
  const nextProjects = [project, ...projects.filter((item) => item.id !== project.id)].slice(0, 12);
  window.localStorage.setItem(PROJECTS_KEY, JSON.stringify(nextProjects));
  return nextProjects;
}
